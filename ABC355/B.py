N,M = map(int,input().split())
A = list(map(int,input().split()))
B = list(map(int,input().split()))

C = sorted(A+B)

for i in range (N):
    for j in range (N):
        D = [C[i],C[j]]

for k in range (len(C)):
    for l in range (len(C)):
        E = [C[k],C[l]]

ans = 0
for i in range (N):
    for j in range (N):
        if D[i]==E[j]:
            ans = 1

if ans == 1:
    print("Yes")
else:
    print("No")