# NTT十进制大整数乘法

输入为可选 +/- 后跟至少一个数字；非法输入抛 invalid_argument；不允许空白。 非零乘法去掉前导零后的位数和-1<=2^23，超出抛 length_error；加减无此 NTT 长度限制。 返回规范十进制字符串，保留必要负号，零统一为 "0"，不含前导零或正号；输入前导零合法。

加减 O(n+m)；乘法 O((n+m) log(n+m)) 时间、O(n+m) 空间。

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

namespace decimal_ntt {
    namespace detail {
        std::pair<bool, std::string> parse(const std::string &s) {
            if (s.empty())
                throw std::invalid_argument("empty integer");
            size_t i = s[0] == '+' || s[0] == '-' ? 1 : 0;
            if (i == s.size())
                throw std::invalid_argument("sign without digits");
            bool neg = s[0] == '-';
            for (size_t j = i; j < s.size(); ++j)
                if (s[j] < '0' || s[j] > '9')
                    throw std::invalid_argument("non-decimal digit");
            while (i + 1 < s.size() && s[i] == '0')
                ++i;
            return {neg, s.substr(i)};
        }
    }
    // 返回十进制整数乘积；非法输入和超长分别抛 invalid_argument/length_error
    std::string multiply(const std::string &a, const std::string &b) {
        auto [na, sa] = detail::parse(a);
        auto [nb, sb] = detail::parse(b);
        if (sa == "0" || sb == "0")
            return "0";
        if (sa.size() + sb.size() - 1 > (1 << 23))
            throw std::length_error("decimal NTT length exceeds 2^23");
        std::vector<int> x(sa.size()), y(sb.size());
        for (int i = 0; i < (int)x.size(); ++i)
            x[i] = sa[sa.size() - 1 - i] - '0';
        for (int i = 0; i < (int)y.size(); ++i)
            y[i] = sb[sb.size() - 1 - i] - '0';
        auto c = poly::nttMul(x, y);
        long long carry = 0;
        std::string s;
        for (int v : c) {
            carry += v;
            s.push_back('0' + carry % 10);
            carry /= 10;
        }
        while (carry) {
            s.push_back('0' + carry % 10);
            carry /= 10;
        }
        if (na != nb)
            s.push_back('-');
        std::reverse(s.begin(), s.end());
        return s;
    }
    namespace detail {
        int compare(const std::string &a, const std::string &b) {
            if (a.size() != b.size())
                return a.size() < b.size() ? -1 : 1;
            return a == b ? 0 : a < b ? -1 : 1;
        }
        std::string addMagnitude(const std::string &a, const std::string &b) {
            int i = a.size() - 1, j = b.size() - 1, carry = 0;
            std::string s;
            while (i >= 0 || j >= 0 || carry) {
                int v = carry + (i >= 0 ? a[i--] - '0' : 0) + (j >= 0 ? b[j--] - '0' : 0);
                s.push_back('0' + v % 10);
                carry = v / 10;
            }
            std::reverse(s.begin(), s.end());
            return s;
        }
        std::string subtractMagnitude(const std::string &a, const std::string &b) {
            int i = a.size() - 1, j = b.size() - 1, borrow = 0;
            std::string s;
            while (i >= 0) {
                int v = a[i--] - '0' - borrow - (j >= 0 ? b[j--] - '0' : 0);
                borrow = v < 0;
                if (borrow)
                    v += 10;
                s.push_back('0' + v);
            }
            while (s.size() > 1 && s.back() == '0')
                s.pop_back();
            std::reverse(s.begin(), s.end());
            return s;
        }
    }
    // 返回任意长度有符号十进制整数和；与 multiply 使用相同输入验证
    std::string add(const std::string &a, const std::string &b) {
        auto [na, sa] = detail::parse(a);
        auto [nb, sb] = detail::parse(b);
        std::string out;
        bool negative;
        if (na == nb)
            out = detail::addMagnitude(sa, sb), negative = na;
        else {
            int c = detail::compare(sa, sb);
            if (!c)
                return "0";
            if (c > 0)
                out = detail::subtractMagnitude(sa, sb), negative = na;
            else
                out = detail::subtractMagnitude(sb, sa), negative = nb;
        }
        return negative && out != "0" ? "-" + out : out;
    }
    // 返回 a-b 的规范十进制字符串
    std::string subtract(const std::string &a, const std::string &b) {
        auto [negative, digits] = detail::parse(b);
        return add(a, negative ? digits : "-" + digits);
    }

}
```
