N=(input())

ans = 0

for bitnum in range (1<<len(N)):
    A = []
    B = []
    for i in range(len(N)):
        if bitnum >>i & 1 == 0:
            A.append(N[i])
        else:
            B.append(N[i])

    if A == [] or B == []:
        continue

    A.sort(reverse=True)
    B.sort(reverse=True)

    A_join = "".join(A)
    B_join = "".join(B)

    ans = max(ans, int(A_join)*int(B_join))

print(ans)