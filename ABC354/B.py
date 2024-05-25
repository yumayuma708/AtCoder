N = int(input())
S = [ None ] * N 
C = [ None ] * N 
for j in range(N):
	s, c = input().split()
	S[j] = s
	C[j] = int(c)

map = {S[i]:T[i]for i in range(len(S))}
T = sum(C)

sortedS = sorted(S)

print (sortedS)

for i in range(N):
	map.get(i) = i
	
for j in range(N):
	if sortedS[j] == T%N :
         print(sortedS[j])

