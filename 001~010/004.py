def main():
    import sys
    input = sys.stdin.read
    N = int(input().strip())

    ans = format(N, '010b')
    print(ans)

if __name__ == "__main__":
    main()
