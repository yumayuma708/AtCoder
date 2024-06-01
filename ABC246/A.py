x1,y1 = map(int,input().split())
x2,y2 = map(int,input().split())
x3,y3 = map(int,input().split())

if x1 ==x2:
    if y2 == y3:
        print(x3,y1)
    else:
        print(x3,y2)
elif x1 ==x3:
    if y2 == y3:
        print(x2,y1)
    else:
        print(x2,y3)
else:
    if y1 == y2:
        print(x1,y3)
    else:
        print(x1,y2)
