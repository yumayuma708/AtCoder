H = int(input())

count = 0
height = 1

while True:
    if H < height:
        print (count + 1)
        break
    else:
        count += 1
        height += 2 ** count