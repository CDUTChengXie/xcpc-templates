# 任意模数组合数（扩展Lucas）

1<=mod<=INT_MAX，n>=0；Binomial 的每个素数幂因子<=maxPrimePower（默认 2000000），超出抛 length_error。 BoundedBinomial 的 maxN>=0，查询须满足 n<=maxN；精确 Pascal 表只支持 0<=n<=66。

两个 choose 都返回 [0,mod) 余数，k<0 或 k>n 返回 0，mod=1 返回 0；建表空间须可承受。

预处理O(sqrt mod+sum p^e)，查询O(sum log_p n+log mod)，空间O(sum p^e)；BoundedBinomial预处理O(maxN·omega(mod)+sqrt mod)，查询O(omega(mod)log mod)，空间O(maxN·omega(mod))；精确Pascal表O(n²)时间/空间。

```cpp
namespace composite_binomial {
    namespace detail {
        // 返回 a^e mod mod。
        long long power(long long a, long long e, long long mod) {
            long long r = 1 % mod;
            for (; e; e >>= 1, a = a * a % mod)
                if (e & 1)
                    r = r * a % mod;
            return r;
        }
        // 返回 a 在模 mod 下的逆元。
        long long inverse(long long a, long long mod) {
            long long b = mod, x = 1, y = 0;
            while (b) {
                long long q = a / b, t = a - q * b;
                a = b;
                b = t;
                t = x - q * y;
                x = y;
                y = t;
            }
            assert(a == 1);
            x %= mod;
            return x < 0 ? x + mod : x;
        }
        // 单个素数幂下的阶乘表。
        struct PrimePower {
            int p, q, e;
            std::vector<int> fact;
            PrimePower(int p, int q, int e) : p(p), q(q), e(e), fact(q + 1, 1) {
                for (int i = 1; i <= q; ++i)
                    fact[i] = i % p ? 1LL * fact[i - 1] * i % q : fact[i - 1];
            }
            long long valuation(long long n) const {
                long long v = 0;
                while (n)
                    n /= p, v += n;
                return v;
            }
            long long factorial(long long n) const {
                long long r = 1;
                while (n) {
                    r = r * power(fact[q], n / q, q) % q * fact[n % q] % q;
                    n /= p;
                }
                return r;
            }
            long long choose(long long n, long long k) const {
                long long v = valuation(n) - valuation(k) - valuation(n - k);
                if (v >= e)
                    return 0;
                return factorial(n) * inverse(factorial(k), q) % q * inverse(factorial(n - k), q) %
                       q * power(p, v, q) % q;
            }
        };
    }
    // 返回精确 Pascal 三角 [0,n]。
    std::vector<std::vector<long long>> pascalExact(int n) {
        assert(n >= 0 && n <= 66);
        std::vector<std::vector<long long>> t(n + 1);
        for (int i = 0; i <= n; ++i) {
            t[i].assign(i + 1, 1);
            for (int j = 1; j < i; ++j)
                t[i][j] = t[i - 1][j - 1] + t[i - 1][j];
        }
        return t;
    }
    // 分解任意模数并预处理素数幂阶乘表。
    class Binomial {
        int mod;
        std::vector<detail::PrimePower> parts;

      public:
        // 建表，越界时抛 length_error。
        explicit Binomial(int mod, int maxPrimePower = 2000000) : mod(mod) {
            assert(mod >= 1 && maxPrimePower >= 1);
            int x = mod;
            for (int p = 2; p <= x / p; ++p)
                if (x % p == 0) {
                    int q = 1, e = 0;
                    while (x % p == 0)
                        x /= p, q *= p, ++e;
                    if (q > maxPrimePower)
                        throw std::length_error("prime power exceeds table bound");
                    parts.emplace_back(p, q, e);
                }
            if (x > 1) {
                if (x > maxPrimePower)
                    throw std::length_error("prime power exceeds table bound");
                parts.emplace_back(x, x, 1);
            }
        }
        // 返回 C(n,k) mod mod。
        int choose(long long n, long long k) const {
            assert(n >= 0);
            if (k < 0 || k > n || mod == 1)
                return 0;
            long long r = 0;
            for (auto &t : parts) {
                long long M = mod / t.q;
                r = (r + t.choose(n, k) * M % mod * detail::inverse(M % t.q, t.q)) % mod;
            }
            return r;
        }
    };
    // 大素数幂且 n 有界时使用的组合数表。
    class BoundedBinomial {
        struct Table {
            int p, q, e;
            std::vector<int> f, inv, val;
        };
        int mod, N;
        std::vector<Table> parts;
        void add(int p, int q, int e) {
            Table t{p,
                    q,
                    e,
                    std::vector<int>(N + 1, 1),
                    std::vector<int>(N + 1, 1),
                    std::vector<int>(N + 1)};
            for (int i = 1; i <= N; ++i) {
                int x = i, v = 0;
                while (x % p == 0)
                    x /= p, ++v;
                t.val[i] = t.val[i - 1] + v;
                t.f[i] = 1LL * t.f[i - 1] * x % q;
            }
            t.inv[N] = detail::inverse(t.f[N], q);
            for (int i = N; i > 0; --i) {
                int x = i;
                while (x % p == 0)
                    x /= p;
                t.inv[i - 1] = 1LL * t.inv[i] * x % q;
            }
            parts.push_back(std::move(t));
        }

      public:
        // 预处理 n∈[0,maxN] 的组合数表。
        BoundedBinomial(int maxN, int mod) : mod(mod), N(maxN) {
            assert(maxN >= 0 && mod >= 1);
            int x = mod;
            for (int p = 2; p <= x / p; ++p)
                if (x % p == 0) {
                    int q = 1, e = 0;
                    while (x % p == 0)
                        x /= p, q *= p, ++e;
                    add(p, q, e);
                }
            if (x > 1)
                add(x, x, 1);
        }
        // 返回 C(n,k) mod mod，n∈[0,maxN]。
        int choose(int n, int k) const {
            assert(n >= 0 && n <= N);
            if (k < 0 || k > n || mod == 1)
                return 0;
            long long ans = 0;
            for (auto &t : parts) {
                int v = t.val[n] - t.val[k] - t.val[n - k];
                if (v >= t.e)
                    continue;
                long long r = 1LL * t.f[n] * t.inv[k] % t.q * t.inv[n - k] % t.q *
                              detail::power(t.p, v, t.q) % t.q;
                long long M = mod / t.q;
                ans = (ans + r * M % mod * detail::inverse(M % t.q, t.q)) % mod;
            }
            return ans;
        }
    };
}
```
