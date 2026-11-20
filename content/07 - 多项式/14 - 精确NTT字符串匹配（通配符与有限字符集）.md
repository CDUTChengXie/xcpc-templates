# 精确NTT字符串匹配（通配符与有限字符集）

text、pattern 按字节匹配；wildcard=-1 禁用，否则是 0..255 的字节值；字符串长度须可放 int。 非空 pattern 且长度不大于 text 时，两串长度和-1<=2^23，否则抛 length_error；空 pattern 的结果长度也须可放 int。

起点从 0 开始，递增且包含重叠匹配；找不到或 pattern 比 text 长返回空；空 pattern 返回 0..text.size() 全部边界。 通配符可出现在 text 和 pattern 两侧，单字节为单位；不按 Unicode 字符计数。

O(N log N) 时间、O(N) 空间，N 是两串总长补齐后的 2 的幂。

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

namespace ntt_matching {
    // 返回全部匹配起点；wildcard 可出现在两侧，-1 禁用
    std::vector<int> matches(const std::string &text, const std::string &pattern,
                             int wildcard = -1) {
        assert(wildcard >= -1 && wildcard <= 255);
        if (text.size() > INT_MAX || pattern.size() > INT_MAX)
            throw std::length_error("string size exceeds int");
        int n = text.size(), m = pattern.size();
        if (m == 0) {
            if (n == INT_MAX)
                throw std::length_error("empty-pattern result exceeds int");
            std::vector<int> out(n + 1);
            std::iota(out.begin(), out.end(), 0);
            return out;
        }
        if (m > n)
            return {};
        long long need = 1LL * n + m - 1;
        if (need > (1 << 23))
            throw std::length_error("NTT length exceeds 2^23");
        int N = 2;
        while (N < need)
            N <<= 1;
        std::vector<int> A(N), B(N), total(N), x(N), y(N);
        for (int i = 0; i < n; ++i)
            A[i] = (unsigned char)text[i] != wildcard;
        for (int j = 0; j < m; ++j)
            B[m - 1 - j] = (unsigned char)pattern[j] != wildcard;
        poly::dft(A);
        poly::dft(B);
        for (int bit = 0; bit < 8; ++bit) {
            std::fill(x.begin(), x.end(), 0);
            std::fill(y.begin(), y.end(), 0);
            for (int i = 0; i < n; ++i)
                if ((unsigned char)text[i] != wildcard)
                    x[i] = ((unsigned char)text[i] >> bit) & 1;
            for (int j = 0; j < m; ++j)
                if ((unsigned char)pattern[j] != wildcard)
                    y[m - 1 - j] = ((unsigned char)pattern[j] >> bit) & 1;
            poly::dft(x);
            poly::dft(y);
            for (int k = 0; k < N; ++k) {
                long long v =
                    (1LL * x[k] * B[k] + 1LL * A[k] * y[k] - 2LL * x[k] * y[k]) % poly::MOD;
                total[k] = (total[k] + v + poly::MOD) % poly::MOD;
            }
        }
        poly::idft(total);
        // 8m < MOD，余数 0 当且仅当真匹配
        std::vector<int> starts;
        for (int s = 0; s <= n - m; ++s)
            if (total[s + m - 1] == 0)
                starts.push_back(s);
        return starts;
    }
}
```
