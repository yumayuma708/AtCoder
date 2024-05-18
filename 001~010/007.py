D,N = map(int, input().split())
L = [ None ] * N
R = [ None ] * N # 中身がnullの、N個の要素を持つリストを作成
T = [ None ] * D # 出力するDを格納するリスト

for i in range(N):
    L[i], R[i] = map(int, input().split())

B = [0] * (D+2)


