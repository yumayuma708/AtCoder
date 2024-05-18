N=int(input())
H = list(map(int, input().split()))

for i in range(1,N):
    if H[i]-H[0]>0:
        print(i+1)
        exit()

print("-1")