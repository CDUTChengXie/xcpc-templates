# 固定底数分块快速幂

T 可由 1 构造，乘法满足结合律；精确值不能溢出，支持完整 unsigned long long 指数，指数 0 返回 T(1)。

预处理约 4*65536 次乘法和同量级存储，单次查询 O(1)。

```cpp
namespace bounded_arithmetic {
// 固定底数的分块快速幂器。
    template <class T> struct PowerBlock {
      private:
        std::array<std::vector<T>, 4> table;

      public:
        // 预处理固定底数的 4 段指数表。
        explicit PowerBlock(T base) {
            for (auto &t : table) {
                t.resize(65537);
                t[0] = T(1);
                for (int i = 1; i <= 65536; ++i)
                    t[i] = t[i - 1] * base;
                base = t[65536];
            }
        }
        // 返回 base^e。
        T ask(unsigned long long e) const {
            T r(1);
            for (int k = 0; k < 4; ++k)
                r = r * table[k][(e >> (16 * k)) & 65535];
            return r;
        }
    };
}
```

## 有界整数 GCD 查询表

1<=N<INT_MAX，O(N) 内存须可承受；查询 x、y 都在 [0,N]，gcd(0,0)=0。

预处理 O(N) 时间与空间，查询 O(1)。

```cpp
namespace bounded_arithmetic {
// 有界非负整数的 O(1) GCD 查询表。
    class FastGCD {
        int N, M;
        std::vector<int> small, minp;
        std::vector<std::array<int, 3>> blocks;

      public:
        // 预处理 [0,N] 的 GCD 查询表。
        explicit FastGCD(int N) : N(N), minp(N + 1), blocks(N + 1) {
            assert(N >= 1 && N < INT_MAX);
            M = std::sqrt((long double)N);
            if (1LL * M * M < N)
                ++M;
            small.resize((size_t)(M + 1) * (M + 1));
            auto at = [&](int a, int b) -> int & { return small[(size_t)a * (M + 1) + b]; };
            for (int a = 0; a <= M; ++a)
                for (int b = 0; b <= a; ++b) {
                    int d = b == 0 ? a : at(b, a % b);
                    at(a, b) = at(b, a) = d;
                }
            blocks[1] = {1, 1, 1};
            std::vector<int> primes;
            for (int i = 2; i <= N; ++i) {
                if (!minp[i]) {
                    minp[i] = i;
                    primes.push_back(i);
                    blocks[i] = {1, 1, i};
                }
                for (int p : primes) {
                    if (p > N / i)
                        break;
                    int v = i * p;
                    minp[v] = p;
                    blocks[v] = blocks[i];
                    blocks[v][0] *= p;
                    std::sort(blocks[v].begin(), blocks[v].end());
                    if (p == minp[i])
                        break;
                }
            }
            // 大于 sqrt(N) 的因子块必须是素数。
            for (int i = 1; i <= N; ++i)
                for (int d : blocks[i])
                    assert(d <= M || minp[d] == d);
        }
        // 返回 gcd(x,y)，x/y∈[0,N]。
        int query(int x, int y) const {
            assert(x >= 0 && x <= N && y >= 0 && y <= N);
            if (!x || !y)
                return x + y;
            int ans = 1;
            for (int d : blocks[x]) {
                int g = d <= M ? small[(size_t)d * (M + 1) + y % d] : (y % d == 0 ? d : 1);
                ans *= g;
                y /= g;
            }
            return ans;
        }
    };
}
```
