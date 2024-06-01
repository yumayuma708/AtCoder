N,M = map(int,input().split())
A = list(map(int,input().split()))
B = list(map(int,input().split()))

C = sorted(A+B)

flag = False

for i in C:
    if i not in A :
        flag =False
    
    elif i in A and flag == False:
        flag = True
    else:
        print("Yes")
        exit()

print("No")
