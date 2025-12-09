N=int(input())
# S,T = map(str,input().split())

# T = int(T)

Mountains = []

for i in range (N):
    S,T = map(str,input().split())
    T = int(T)
    Mountains.append([T,S])

Mountains.sort(reverse=True)

print(Mountains[1][1])