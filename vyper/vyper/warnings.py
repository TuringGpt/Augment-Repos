import contextlib
import contextvars
import warnings
from collections import Counter
from collections.abc import Iterator, MutableMapping
from typing import Optional

from vyper.exceptions import _BaseVyperException

_warning_category_counts: contextvars.ContextVar[MutableMapping[str, int] | None] = (
    contextvars.ContextVar("warning_category_counts", default=None)
)


class VyperWarning(_BaseVyperException, Warning):
    pass


# print a warning
def vyper_warn(warning: VyperWarning | str, node=None):
    if isinstance(warning, str):
        warning = VyperWarning(warning, node)

    category_counts = _warning_category_counts.get()
    if category_counts is not None:
        category = type(warning).__name__
        category_counts[category] = category_counts.get(category, 0) + 1

    warnings.warn(warning, stacklevel=2)


@contextlib.contextmanager
def warning_category_counter(
    counter: Optional[MutableMapping[str, int]] = None,
) -> Iterator[MutableMapping[str, int]]:
    if counter is None:
        counter = Counter()

    token = _warning_category_counts.set(counter)
    try:
        yield counter
    finally:
        _warning_category_counts.reset(token)


@contextlib.contextmanager
def warnings_filter(warnings_control: Optional[str]):
    # note: using warnings.catch_warnings() since it saves and restores
    # the warnings filter
    with warnings.catch_warnings():
        set_warnings_filter(warnings_control)
        yield


def set_warnings_filter(warnings_control: Optional[str]):
    if warnings_control == "error":
        warnings_filter = "error"
    elif warnings_control == "none":
        warnings_filter = "ignore"
    else:
        assert warnings_control is None  # sanity
        warnings_filter = "default"

    if warnings_control is not None:
        # warnings.simplefilter only adds to the warnings filters,
        # so we should clear warnings filter between calls to simplefilter()
        warnings.resetwarnings()

    # NOTE: in the future we can do more fine-grained control by setting
    # category to specific warning types
    warnings.simplefilter(warnings_filter, category=VyperWarning)  # type: ignore[arg-type]


class ContractSizeLimit(VyperWarning):
    """
    Warn if past the EIP-170 size limit
    """

    pass


class EnumUsage(VyperWarning):
    """
    Warn about using `enum` instead of `flag
    """

    pass


class Deprecation(VyperWarning):
    """
    General deprecation warning
    """

    pass
