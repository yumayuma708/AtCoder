P = list(map(int,input().split()))

ans = ""

for i in range(26):
    ans += chr(P[i]+96)

print(ans)
