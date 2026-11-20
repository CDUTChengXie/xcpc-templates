# 全在线卷积（Relaxed Convolution）

模 998244353，输入系数规范；Relaxed 容量 0..2^21，Inverse 容量 1..2^21。 Exponential、Logarithm 容量 n 为 1..2^21+1；最多各 push 容量次，逆的首项非零，exp 的首项 0，ln 的首项 1。

每个对象的第一次 push 对应下标 0，按顺序传 f[k]（或两序列同一 k），返回值是 x^k 系数；不能撤回。

n 次 push 总 O(n log^2 n)，空间 O(n)。

```cpp
namespace poly {
#ifndef XCPC_TEMPLATE_NTT
#define XCPC_TEMPLATE_NTT

    constexpr int MOD = 998244353;
    constexpr int ROOT = 3;

    // 返回 a^b mod MOD，要求 b >= 0
    int powerMod(int a, i64 b) {
        i64 res = 1, x = a;
        for (; b; b >>= 1, x = x * x % MOD) {
            if (b & 1) {
                res = res * x % MOD;
            }
        }
        return int(res);
    }

    std::vector<int> rev, roots{0, 1};

    // 原地正变换；要求 a.size() 是大于 1 的 2 的幂
    void dft(std::vector<int> &a) {
        int n = a.size();
        if (int(rev.size()) != n) {
            int k = __builtin_ctz(unsigned(n)) - 1;
            rev.resize(n);
            for (int i = 0; i < n; i++) {
                rev[i] = rev[i >> 1] >> 1 | (i & 1) << k;
            }
        }
        for (int i = 0; i < n; i++) {
            if (rev[i] < i) {
                std::swap(a[i], a[rev[i]]);
            }
        }
        if (int(roots.size()) < n) {
            int k = __builtin_ctz(unsigned(roots.size()));
            roots.resize(n);
            while ((1 << k) < n) {
                // 必须用 (MOD - 1) >> (k + 1)；998244353 - 1 含因子 119
                int e = powerMod(ROOT, (MOD - 1) >> (k + 1));
                for (int i = 1 << (k - 1); i < (1 << k); i++) {
                    roots[2 * i] = roots[i];
                    roots[2 * i + 1] = int(1LL * roots[i] * e % MOD);
                }
                k++;
            }
        }

        for (int k = 1; k < n; k *= 2) {
            for (int i = 0; i < n; i += 2 * k) {
                for (int j = 0; j < k; j++) {
                    int u = a[i + j];
                    int v = int(1LL * a[i + j + k] * roots[k + j] % MOD);
                    a[i + j] = (u + v) % MOD;
                    a[i + j + k] = (u - v + MOD) % MOD;
                }
            }
        }
    }

    // 原地逆变换；要求 a.size() 是大于 1 的 2 的幂
    void idft(std::vector<int> &a) {
        int n = a.size();
        std::reverse(a.begin() + 1, a.end());
        dft(a);
        // 必须取正代表元，避免后续乘法产生负余数
        int inv = MOD - (MOD - 1) / n;
        for (int i = 0; i < n; i++) {
            a[i] = int(1LL * a[i] * inv % MOD);
        }
    }

    // 返回乘积系数，result[i] 对应 x^i；任一输入为空返回空
    std::vector<int> nttMul(std::vector<int> a, std::vector<int> b) {
        if (a.empty() || b.empty()) {
            return {};
        }
        int n = 1, tot = int(a.size() + b.size() - 1);
        while (n < tot && n <= (1 << 23)) {
            n *= 2;
        }
        assert(n >= tot && "NTT 长度超出 998244353 支持的 2^23，请改用 469762049 或拆分卷积");
        if (tot < 128) {
            std::vector<int> c(tot, 0);
            int na = a.size(), nb = b.size();
            for (int i = 0; i < na; i++) {
                for (int j = 0; j < nb; j++) {
                    c[i + j] = int((c[i + j] + 1LL * a[i] * b[j]) % MOD);
                }
            }
            return c;
        }
        a.resize(n);
        b.resize(n);
        dft(a);
        dft(b);
        for (int i = 0; i < n; i++) {
            a[i] = int(1LL * a[i] * b[i] % MOD);
        }
        idft(a);
        a.resize(tot);
        return a;
    }

    // 返回 1/f 的前 m 项系数，result[i] 对应 x^i；要求 f 非空且 f[0]!=0
    std::vector<int> polyInv(std::vector<int> f, int m) {
        assert(!f.empty() && f[0] != 0 && "polyInv 要求 f[0] != 0");
        if (m <= 0) {
            return {};
        }
        std::vector<int> g(1, powerMod(f[0], MOD - 2));
        for (int len = 1; len < m; len *= 2) {
            std::vector<int> t(f.begin(), f.begin() + std::min(2 * len, int(f.size())));
            auto h = nttMul(t, g);
            h.resize(2 * len, 0);
            for (int i = 0; i < 2 * len; i++) {
                h[i] = (MOD - h[i]) % MOD;
            }
            h[0] = (h[0] + 2) % MOD;
            g = nttMul(g, h);
            g.resize(2 * len);
        }
        g.resize(m);
        return g;
    }

#endif // XCPC_TEMPLATE_NTT
}

namespace online_convolution {
#ifndef XCPC_RELAXED_CONVOLUTION
#define XCPC_RELAXED_CONVOLUTION
    // 维护两条逐项输入的序列，并返回当前下标卷积系数
    struct Relaxed {
      private:
        int capacity;
        std::vector<int> f, g, c;

      public:
        // 创建容量 capacity 的在线卷积；容量0时不可 push。
        explicit Relaxed(int capacity) : capacity(capacity), c(capacity) {
            assert(capacity >= 0 && capacity <= (1 << 21));
        }
        // 返回下一下标已由此前项产生的贡献；两个端点尚未加入。
        int pending() const {
            assert(f.size() < capacity);
            return c[f.size()];
        }
        // 添加两条序列的同一下标项，返回此下标的精确卷积余数。
        int push(int x, int y) {
            int k = f.size();
            assert(k < capacity && x >= 0 && x < poly::MOD && y >= 0 && y < poly::MOD);
            f.push_back(x);
            g.push_back(y);
            c[k] = (c[k] + 1LL * f[0] * y + (k ? 1LL * g[0] * x : 0)) % poly::MOD;
            int p = k + 1, b = p & -p;
            if (p >= capacity)
                return c[k];
            std::vector<int> a(f.begin() + p - b, f.begin() + p),
                d(g.begin() + p - b, g.begin() + p);
            std::vector<int> h;
            if (p == b)
                h = poly::nttMul(a, d);
            else {
                std::vector<int> fa(f.begin(), f.begin() + 2 * b), ga(g.begin(), g.begin() + 2 * b);
                h = poly::nttMul(a, ga);
                auto t = poly::nttMul(d, fa);
                for (int i = 0; i < (int)h.size(); ++i)
                    h[i] = (h[i] + t[i]) % poly::MOD;
            }
            h.resize(std::max((int)h.size(), 2 * b), 0);
            for (int j = p; j < std::min(capacity, p + b); ++j)
                c[j] = (c[j] + h[j - p + b]) % poly::MOD;
            return c[k];
        }
    };
    // 维护全在线 FPS 逆，每次返回当前下标的逆系数
    struct Inverse {
      private:
        Relaxed conv;
        int inverse0 = 0;

      public:
        // 容量至少1；首个push输入为f[0]。
        explicit Inverse(int n) : conv(n) {
            assert(n >= 1);
        }
        // 添加f当前系数，返回1/f的当前系数。
        int push(int v) {
            if (!inverse0) {
                assert(v > 0 && v < poly::MOD);
                inverse0 = poly::powerMod(v, poly::MOD - 2);
                conv.push(inverse0, v);
                return inverse0;
            }
            int g = (poly::MOD - (conv.pending() + 1LL * inverse0 * v) % poly::MOD) % poly::MOD *
                    1LL * inverse0 % poly::MOD;
            conv.push(g, v);
            return g;
        }
    };
    // 维护全在线 FPS 指数，每次返回当前下标的 exp 系数
    struct Exponential {
      private:
        Relaxed conv;
        int k = 0, previous = 1;
        std::vector<int> inv;

      public:
        // 容量n>=1，预处理[1,n)逆元。
        explicit Exponential(int n) : conv(std::max(0, n - 1)), inv(n) {
            assert(n >= 1);
            if (n > 1)
                inv[1] = 1;
            for (int i = 2; i < n; ++i)
                inv[i] = 1LL * (poly::MOD - poly::MOD / i) * inv[poly::MOD % i] % poly::MOD;
        }
        // 添加f[k]，返回exp(f)[k]；首项必须0。
        int push(int v) {
            assert(k < (int)inv.size() && v >= 0 && v < poly::MOD);
            if (k++ == 0) {
                assert(v == 0);
                return 1;
            }
            int c = conv.push(previous, 1LL * (k - 1) * v % poly::MOD);
            return previous = 1LL * c * inv[k - 1] % poly::MOD;
        }
    };
    // 维护全在线 FPS 对数，每次返回当前下标的 ln 系数
    struct Logarithm {
      private:
        Relaxed conv;
        int k = 0, contribution = 0;
        std::vector<int> inv;

      public:
        // 容量n>=1，预处理[1,n)逆元。
        explicit Logarithm(int n) : conv(std::max(0, n - 1)), inv(n) {
            assert(n >= 1);
            if (n > 1)
                inv[1] = 1;
            for (int i = 2; i < n; ++i)
                inv[i] = 1LL * (poly::MOD - poly::MOD / i) * inv[poly::MOD % i] % poly::MOD;
        }
        // 添加f[k]，返回ln(f)[k]；首项必须1。
        int push(int v) {
            assert(k < (int)inv.size() && v >= 0 && v < poly::MOD);
            if (k++ == 0) {
                assert(v == 1);
                return 0;
            }
            int c = (v - 1LL * contribution * inv[k - 1] % poly::MOD + poly::MOD) % poly::MOD;
            contribution = conv.push(1LL * (k - 1) * c % poly::MOD, v);
            return c;
        }
    };
#endif // XCPC_RELAXED_CONVOLUTION
}
```
