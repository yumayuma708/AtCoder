def main():
    import sys
    input = sys.stdin.read
    data = input().split()
    
    N = int(data[0])  # 整数 N を読み込む
    X = int(data[1])  # 整数 X を読み込む
    A = list(map(int, data[2:2+N]))  # N 個の整数 A をリストとして読み込む
    
    if X in A:
        print("Yes")
    else:
        print("No")

if __name__ == "__main__":
    main()
