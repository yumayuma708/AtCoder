import sys

def main(lines): 
    n, m = map(int, lines[0].split())

    if n % 2 != 0 or m % 2 != 0:
        result = 0
    else:
        half_tiles = (n * m) // 2

        result = 1
        for i in range(half_tiles):
            result *= (n * m - i)
            result //= (i + 1)

        result %= 1000000000

    print(f"{result:09d}")

if __name__ == '__main__':
    lines = []
    for l in sys.stdin:
        lines.append(l.rstrip('\r\n'))
    main(lines)
