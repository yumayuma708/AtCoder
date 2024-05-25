def main():
    import sys
    input = sys.stdin.read
    data = input().split()

if __name__ == "__main__":
    main()


L = [ None ] * Q 
R = [ None ] * Q 
for j in range(Q):
	L[j], R[j] = map(int, input().split())