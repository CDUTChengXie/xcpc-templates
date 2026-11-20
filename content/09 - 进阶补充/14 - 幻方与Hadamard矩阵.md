# 幻方与Hadamard矩阵

幻方 n 为正奇数且 n<=2001；Hadamard 阶数为 2^k，k 在 0..10；非法阶数抛 invalid_argument。 下标 [0,n)；幻方用 1..n²，Hadamard 元素为 ±1。

时间、空间均 O(n²)。

```cpp
namespace MatrixConstruct {
    // 构造正奇数 n 的幻方；n<=2001 控制内存与数字范围
    std::vector<std::vector<int>> magic(int n) {
        if (n < 1 || n > 2001 || n % 2 == 0)
            throw std::invalid_argument("odd order");
        std::vector a(n, std::vector<int>(n));
        int x = 0, y = n / 2;
        for (int v = 1; v <= n * n; ++v) {
            a[x][y] = v;
            int nx = (x + n - 1) % n, ny = (y + 1) % n;
            if (a[nx][ny])
                x = (x + 1) % n;
            else {
                x = nx;
                y = ny;
            }
        }
        return a;
    }
    // 构造 2^k 阶 ±1 Hadamard 矩阵；0<=k<=10
    std::vector<std::vector<int>> hadamard(int k) {
        if (k < 0 || k > 10)
            throw std::invalid_argument("order");
        int n = 1 << k;
        std::vector a(n, std::vector<int>(n));
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                a[i][j] = std::popcount(unsigned(i & j)) % 2 ? -1 : 1;
        return a;
    }
}
```
