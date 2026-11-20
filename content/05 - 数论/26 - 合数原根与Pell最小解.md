# 模数分解与合数原根

1<=mod<=INT_MAX；原根只存在于 2、4、奇素数幂及其两倍，mod=1 没有原根。不存在时 primitiveRoot 返回 nullopt，allRoots 返回空数组。

分解 O(sqrt mod)；原根搜索最坏 O(mod*omega(phi)*log mod)，枚举 O(phi*log mod)。

```cpp
namespace classical_number {
// 单个模数的分解、欧拉函数与原根工具。
    class Modulus {
        int m;
        long long value;
        std::vector<int> factors, phiFactors;
        long long power(long long a, long long e) const {
            long long r = 1;
            for (; e; e >>= 1, a = a * a % m)
                if (e & 1)
                    r = r * a % m;
            return r;
        }

      public:
        // 建立正模数的分解与欧拉函数。
        explicit Modulus(int mod) : m(mod), value(mod) {
            assert(mod >= 1);
            int x = mod;
            for (int p = 2; p <= x / p; ++p)
                if (x % p == 0) {
                    factors.push_back(p);
                    value = value / p * (p - 1);
                    while (x % p == 0)
                        x /= p;
                }
            if (x > 1) {
                factors.push_back(x);
                value = value / x * (x - 1);
            }
            x = value;
            for (int p = 2; p <= x / p; ++p)
                if (x % p == 0) {
                    phiFactors.push_back(p);
                    while (x % p == 0)
                        x /= p;
                }
            if (x > 1)
                phiFactors.push_back(x);
        }
        // 返回 phi(mod)。
        long long phi() const {
            return value;
        }
        // 返回最小原根，不存在时返回 nullopt。
        std::optional<int> primitiveRoot() const {
            if (m == 2)
                return 1;
            if (m == 4)
                return 3;
            if (m == 1 || m % 4 == 0)
                return {};
            int odd = m;
            while (odd % 2 == 0)
                odd /= 2;
            int distinct = 0;
            for (int p : factors)
                if (p != 2)
                    ++distinct;
            if (distinct != 1 || odd == 1)
                return {};
            for (int g = 2; g < m; ++g)
                if (std::gcd(g, m) == 1) {
                    bool ok = true;
                    for (int p : phiFactors)
                        if (power(g, value / p) == 1) {
                            ok = false;
                            break;
                        }
                    if (ok)
                        return g;
                }
            return {};
        }
        // 返回全部原根升序。
        std::vector<int> allRoots() const {
            auto g = primitiveRoot();
            if (!g)
                return {};
            std::vector<int> roots;
            long long v = 1;
            for (long long k = 1; k <= value; ++k) {
                v = v * (*g) % m;
                if (std::gcd(k, value) == 1)
                    roots.push_back(v);
            }
            std::sort(roots.begin(), roots.end());
            return roots;
        }
    };
}
```

## Pell 方程最小正解

2<=D<=10^12；平方 D 返回空 optional。T 支持整数构造、乘小整数与加法，容量必须足够；用 i64 时自行保证不溢出。

O(连分数周期*T 乘小整数成本) 时间与 O(周期+T 位数) 空间。

```cpp
namespace classical_number {
// 返回 x²-Dy²=1 的最小正解，平方 D 返回 nullopt。
    template <class T> std::optional<std::pair<T, T>> pellMinimum(long long D) {
        assert(D >= 2 && D <= 1000000000000LL);
        long long a0 = std::sqrt((long double)D);
        while ((a0 + 1) * (a0 + 1) <= D)
            ++a0;
        while (a0 * a0 > D)
            --a0;
        if (a0 * a0 == D)
            return {};
        long long m = 0, d = 1, a = a0;
        std::vector<int> period;
        do {
            m = d * a - m;
            d = (D - m * m) / d;
            a = (a0 + m) / d;
            period.push_back(a);
        } while (a != 2 * a0);
        size_t length = period.size() * (period.size() % 2 ? 2 : 1);
        T h2(0), h1(1), k2(1), k1(0);
        for (size_t i = 0; i < length; ++i) {
            int coefficient = i ? period[(i - 1) % period.size()] : (int)a0;
            T h = h1, k = k1;
            h *= coefficient;
            h += h2;
            k *= coefficient;
            k += k2;
            h2 = h1;
            h1 = h;
            k2 = k1;
            k1 = k;
        }
        return std::pair{h1, k1};
    }
}
```
