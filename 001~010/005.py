def main():
    import sys
    input = sys.stdin.read
    data = input().split()
    N = int(data[0])
    K = int(data[1])

    count = 0

    for i in range (1, N+1):
        for j in range (1, N+1):
            k = K - i - j
            if 1 <= k <= N:
                 count += 1
    
    print(count)

if __name__ == "__main__":
    main()
