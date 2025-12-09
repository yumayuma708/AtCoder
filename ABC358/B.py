N,A = map(int,input().split())
T = list(map(int,input().split()))

ans = []

for i in range(N):
    if i == 0:
        ans.append(T[i]+A)
    else:
        if T[i] >= ans[-1]:
            ans.append(T[i]+A)
        else:
            ans.append(ans[-1] + A)

for i in range (len(ans)):
    print(ans[i])
