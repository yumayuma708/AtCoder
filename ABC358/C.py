n,m=map(int,input().split())
s=[list(input()) for i in range(n)]
INF=float('inf')
ans=INF
for bit in range(1<<n):
    ans_tmp=0
    shops=[]
    for i in range(n):
        if bit>>i&1:
            shops.append(i)

    flavor=[False]*m
    for shop in shops:
        for i in range(m):
            if s[shop][i]=="o":
                flavor[i]=True

    if all(flavor):
        ans_tmp=len(shops)
        ans=min(ans,ans_tmp)
print(ans)