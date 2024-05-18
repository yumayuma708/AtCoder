t = int(input())

def fun (t):
    x = t**2+2*t+3
    return x

print(
    fun(fun(fun(t)+t)+fun(fun(t)))
    )