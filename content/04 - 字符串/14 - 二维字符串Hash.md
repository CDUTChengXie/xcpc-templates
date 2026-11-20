# 二维字符串Hash

grid、patternGrid 为 `vector<string>`，各自每行等宽；哈希可能碰撞。 行列下标从 0 开始；get(x1,y1,x2,y2) 包含左上角、不含右下角，行区间 [x1,x2)、列区间 [y1,y2)。 比较前须保证两块的行数、列数分别相同；空矩形的哈希为 {0,0}。

预处理时间、空间 O(nm+n+m)；查询 O(1)。

```cpp
// 等宽字符矩阵的双模矩形哈希。
class StringHash2D {
    static constexpr int mods[2] = {1000000007, 1000000009};
    static constexpr i64 rowBase = 911382323, colBase = 972663749;
    int n, m;
    array<vector<vector<int>>, 2> h;
    array<vector<int>, 2> rowPow, colPow;

  public:
    // 建立等宽矩阵的双模哈希；空矩阵、零列合法。
    explicit StringHash2D(const vector<string> &a) : n(a.size()), m(a.empty() ? 0 : a[0].size()) {
        for (const auto &row : a)
            assert(int(row.size()) == m);
        for (int k = 0; k < 2; k++) {
            i64 mod = mods[k];
            rowPow[k].assign(n + 1, 1);
            colPow[k].assign(m + 1, 1);
            h[k].assign(n + 1, vector<int>(m + 1));
            for (int i = 1; i <= n; i++)
                rowPow[k][i] = rowPow[k][i - 1] * rowBase % mod;
            for (int j = 1; j <= m; j++)
                colPow[k][j] = colPow[k][j - 1] * colBase % mod;
            for (int i = 1; i <= n; i++)
                for (int j = 1; j <= m; j++) {
                    i64 v = static_cast<unsigned char>(a[i - 1][j - 1]) + 1;
                    v = (v + h[k][i - 1][j] * rowBase + h[k][i][j - 1] * colBase) % mod;
                    v = (v - h[k][i - 1][j - 1] * rowBase % mod * colBase % mod + mod) % mod;
                    h[k][i][j] = v;
                }
        }
    }
    // 返回半开矩形的双哈希；空矩形返回 {0,0}。
    array<int, 2> get(int x1, int y1, int x2, int y2) const {
        assert(0 <= x1 && x1 <= x2 && x2 <= n && 0 <= y1 && y1 <= y2 && y2 <= m);
        array<int, 2> ans;
        for (int k = 0; k < 2; k++) {
            i64 mod = mods[k], rp = rowPow[k][x2 - x1], cp = colPow[k][y2 - y1];
            i64 v = (h[k][x2][y2] - h[k][x1][y2] * rp % mod - h[k][x2][y1] * cp % mod +
                     h[k][x1][y1] * rp % mod * cp % mod) %
                    mod;
            ans[k] = (v + mod) % mod;
        }
        return ans;
    }
};
```
