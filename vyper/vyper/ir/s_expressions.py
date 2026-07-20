# Adapted from https://en.wikipedia.org/wiki/S-expression#Parsing


def parse_literal(word):
    try:
        return int(word)
    except ValueError:
        return word


def parse_s_exp(string):
    sexp = [[]]
    word = ""
    in_str = False
    in_comment = False

    def flush_word():
        nonlocal word
        if word:
            sexp[-1].append(parse_literal(word))
            word = ""

    for char in string:
        if in_comment:
            if char == "\n":  # comment ends at the end of a line
                in_comment = False
            continue
        if char == ";":  # start of comment
            in_comment = True
            continue
        if char == "(" and not in_str:
            sexp.append([])
        elif char == ")" and not in_str:
            flush_word()
            temp = sexp.pop()
            sexp[-1].append(temp)
        elif char in (" ", "\n", "\t") and not in_str:
            flush_word()
        elif char == '"':
            in_str = not in_str
        else:
            word += char
    return sexp[0]
