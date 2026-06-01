import contextlib
import json
import posixpath
from dataclasses import asdict, dataclass, field
from functools import cached_property
from pathlib import Path, PurePath
from typing import TYPE_CHECKING, Any, Iterator, Optional

from vyper.exceptions import JSONError
from vyper.utils import sha256sum

# a type to make mypy happy
PathLike = Path | PurePath

if TYPE_CHECKING:
    from zipfile import ZipFile

# hacky sentinel to indicate that a file came from InputBundle for builtins
BUILTIN = -2


@dataclass(frozen=True)
class CompilerInput:
    # an input to the compiler, basically an abstraction for file contents

    source_id: int
    path: PathLike  # the path that was asked for

    # resolved_path is the real path that was resolved to.
    # mainly handy for debugging at this point
    resolved_path: PathLike
    contents: str

    @cached_property
    def sha256sum(self):
        return sha256sum(self.contents)

    @property
    def from_builtin(self):
        return self.source_id == BUILTIN

    # fast hash which doesn't require looking at the contents
    def __hash__(self):
        return hash((self.source_id, self.path, self.resolved_path))


@dataclass(frozen=True)
class FileInput(CompilerInput):
    @cached_property
    def source_code(self):
        return self.contents

    def __hash__(self):
        # don't use dataclass provided implementation
        return super().__hash__()


@dataclass(frozen=True)
class JSONInput(CompilerInput):
    # some json input, which has already been parsed into a dict or list
    # this is needed because json inputs present json interfaces as json
    # objects, not as strings. this class helps us avoid round-tripping
    # back to a string to pretend it's a file.
    data: Any = field()  # something that json.load() returns

    @classmethod
    def from_file_input(cls, file_input: FileInput) -> "JSONInput":
        s = json.loads(file_input.source_code)
        return cls(**asdict(file_input), data=s)

    def __hash__(self):
        # don't use dataclass provided implementation
        return super().__hash__()


class _NotFound(Exception):
    pass


# an opaque object which consumers can get/set attributes on
class _Cache(object):
    pass


# an "input bundle" to the compiler, representing the files which are
# available to the compiler. it is useful because it parametrizes I/O
# operations over different possible input types. you can think of it
# as a virtual filesystem which models the compiler's interactions
# with the outside world. it exposes a "load_file" operation which
# searches for a file from a set of search paths, and also provides
# id generation service to get a unique source id per file.
class InputBundle:
    # a list of search paths
    search_paths: list[PathLike]

    _cache: Any

    def __init__(self, search_paths):
        self.search_paths = search_paths
        self._source_id_counter = 0
        self._source_ids: dict[PathLike, int] = {}

        # this is a little bit cursed, but it allows consumers to cache data
        # that share the same lifetime as this input bundle.
        self._cache = _Cache()

    def _normalize_path(self, path):
        raise NotImplementedError(f"not implemented! {self.__class__}._normalize_path()")

    def _load_from_path(self, resolved_path, path):
        raise NotImplementedError(f"not implemented! {self.__class__}._load_from_path()")

    def _generate_source_id(self, resolved_path: PathLike) -> int:
        # Note: it is possible for a file to get in here more than once,
        # e.g. by symlink
        if resolved_path not in self._source_ids:
            self._source_ids[resolved_path] = self._source_id_counter
            self._source_id_counter += 1

        return self._source_ids[resolved_path]

    def load_file(self, path: PathLike | str) -> FileInput:
        # search path precedence
        tried = []
        if isinstance(path, str):
            path = PurePath(path)
        for sp in reversed(self.search_paths):
            # note from pathlib docs:
            # > If the argument is an absolute path, the previous path is ignored.
            # Path("/a") / Path("/b") => Path("/b")
            to_try = sp / path

            try:
                to_try = self._normalize_path(to_try)
                res = self._load_from_path(to_try, path)
                break
            except _NotFound:
                tried.append(to_try)

        else:
            formatted_search_paths = "\n".join(["  " + str(p) for p in tried])
            raise FileNotFoundError(
                f"could not find {path} in any of the following locations:\n"
                f"{formatted_search_paths}"
            )

        return res

    def load_json_file(self, path: PathLike | str) -> JSONInput:
        file_input = self.load_file(path)
        return JSONInput.from_file_input(file_input)

    # temporarily add something to the search path (within the
    # scope of the context manager) with highest precedence.
    # if `path` is None, do nothing
    @contextlib.contextmanager
    def search_path(self, path: Optional[PathLike]) -> Iterator[None]:
        if path is None:
            yield  # convenience, so caller does not have to handle null path

        else:
            self.search_paths.append(path)
            try:
                yield
            finally:
                self.search_paths.pop()

    # temporarily set search paths to a given list
    @contextlib.contextmanager
    def temporary_search_paths(self, new_paths: list[PathLike]) -> Iterator[None]:
        original_paths = self.search_paths
        self.search_paths = new_paths
        try:
            yield
        finally:
            self.search_paths = original_paths

    # enumerate dotted module paths reachable from `search_paths` for files
    # whose suffix is in `suffixes`. used to power typo suggestions when an
    # import fails. subclasses override `_enumerate_files` to provide the
    # actual file listing for their storage backend.
    def available_modules(
        self, suffixes: list[str], search_paths: Optional[list[PathLike]] = None
    ) -> set[str]:
        if search_paths is None:
            search_paths = self.search_paths

        results: set[str] = set()
        for sp in search_paths:
            for rel_path in self._enumerate_files(sp, suffixes):
                # rel_path is a PurePath relative to the search path,
                # already stripped of its suffix.
                results.add(rel_path.as_posix().replace("/", "."))
        return results

    # yield PurePaths (suffix stripped) for files under `search_path` whose
    # suffix matches one in `suffixes`. default: nothing. subclasses override.
    def _enumerate_files(self, search_path: PathLike, suffixes: list[str]) -> Iterator[PurePath]:
        return iter(())


# regular input. takes a search path(s), and `load_file()` will search all
# search paths for the file and read it from the filesystem
class FilesystemInputBundle(InputBundle):
    def _normalize_path(self, path: Path) -> Path:
        # normalize the path with os.path.normpath, to break down
        # things like "foo/bar/../x.vy" => "foo/x.vy", with all
        # the caveats around symlinks that os.path.normpath comes with.
        try:
            return path.resolve(strict=True)
        except (FileNotFoundError, NotADirectoryError):
            raise _NotFound(path)

    def _load_from_path(self, resolved_path: Path, original_path: Path) -> CompilerInput:
        try:
            with resolved_path.open() as f:
                code = f.read()
        except (FileNotFoundError, NotADirectoryError):
            raise _NotFound(resolved_path)

        source_id = super()._generate_source_id(resolved_path)

        return FileInput(source_id, original_path, resolved_path, code)

    def _enumerate_files(self, search_path: PathLike, suffixes: list[str]) -> Iterator[PurePath]:
        base = Path(search_path)
        if not base.is_dir():
            return
        for suffix in suffixes:
            for p in base.rglob(f"*{suffix}"):
                if not p.is_file():
                    continue
                try:
                    rel = p.relative_to(base)
                except ValueError:
                    continue
                yield rel.with_suffix("")


# wrap os.path.normpath, but return the same type as the input -
# but use posixpath instead so that things work cross-platform.
def _normpath(path):
    cls = path.__class__
    if not isinstance(path, str):
        path = path.as_posix()
    return cls(posixpath.normpath(path))


# fake filesystem for "standard JSON" (aka solc-style) inputs. takes search
# paths, and `load_file()` "reads" the file from the JSON input. Note that this
# input bundle type never actually interacts with the filesystem -- it is
# guaranteed to be pure!
class JSONInputBundle(InputBundle):
    input_json: dict[PurePath, Any]

    def __init__(self, input_json, search_paths):
        super().__init__(search_paths)
        self.input_json = {}
        for path, item in input_json.items():
            path = _normpath(path)

            # should be checked by caller
            assert path not in self.input_json
            self.input_json[path] = item

    def _normalize_path(self, path: PurePath) -> PurePath:
        return _normpath(path)

    def _load_from_path(self, resolved_path: PurePath, original_path: PurePath) -> CompilerInput:
        try:
            value = self.input_json[resolved_path]
        except KeyError:
            raise _NotFound(resolved_path)

        source_id = super()._generate_source_id(resolved_path)

        if "content" in value:
            return FileInput(source_id, original_path, resolved_path, value["content"])

        if "abi" in value:
            return JSONInput(
                source_id, original_path, resolved_path, json.dumps(value), value["abi"]
            )

        # TODO: ethPM support
        # if isinstance(contents, dict) and "contractTypes" in contents:

        # unreachable, based on how JSONInputBundle is constructed in
        # the codebase.
        raise JSONError(f"Unexpected type in file: '{resolved_path}'")  # pragma: nocover

    def _enumerate_files(self, search_path: PathLike, suffixes: list[str]) -> Iterator[PurePath]:
        base = _normpath(search_path)
        base_str = base.as_posix().rstrip("/")
        suffix_set = set(suffixes)
        for path in self.input_json.keys():
            if path.suffix not in suffix_set:
                continue
            path_str = path.as_posix()
            # check that `path` lives under `base`. handle the bare "." base.
            if base_str in ("", "."):
                rel_str = path_str
            elif path_str.startswith(base_str + "/"):
                rel_str = path_str[len(base_str) + 1 :]
            else:
                continue
            yield PurePath(rel_str).with_suffix("")


# input bundle for vyper archives. similar to JSONInputBundle, but takes
# a zipfile as input.
class ZipInputBundle(InputBundle):
    def __init__(self, archive: "ZipFile"):
        assert archive.testzip() is None
        self.archive = archive

        sp_str = archive.read("MANIFEST/searchpaths").decode("utf-8")
        search_paths = [PurePath(p) for p in sp_str.splitlines()]

        super().__init__(search_paths)

    def _normalize_path(self, path: PurePath) -> PurePath:
        return _normpath(path)

    def _load_from_path(self, resolved_path: PurePath, original_path: PurePath) -> CompilerInput:
        # zipfile.BadZipFile: File is not a zip file

        try:
            value = self.archive.read(resolved_path.as_posix()).decode("utf-8")
        except KeyError:
            # zipfile literally raises KeyError if the file is not there
            raise _NotFound(resolved_path)

        source_id = super()._generate_source_id(resolved_path)

        return FileInput(source_id, original_path, resolved_path, value)

    def _enumerate_files(self, search_path: PathLike, suffixes: list[str]) -> Iterator[PurePath]:
        base = _normpath(search_path)
        base_str = base.as_posix().rstrip("/")
        suffix_set = set(suffixes)
        for name in self.archive.namelist():
            # skip directory entries
            if name.endswith("/"):
                continue
            path = PurePath(name)
            if path.suffix not in suffix_set:
                continue
            if base_str in ("", "."):
                rel_str = name
            elif name.startswith(base_str + "/"):
                rel_str = name[len(base_str) + 1 :]
            else:
                continue
            yield PurePath(rel_str).with_suffix("")
