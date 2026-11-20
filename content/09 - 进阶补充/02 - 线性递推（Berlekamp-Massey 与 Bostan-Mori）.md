# 线性递推（BM 与朴素求项）

mod 为素数；序列确为线性递推，通常需至少 2k 项才能恢复 k 阶递推；直接提供 rec 时 init 至少有 k 项。 输入系数先规范到 [0,mod)，所有 i64 乘法/加法中间值须不溢出；递推阶数宜小。 下标从 0 起；rec[j] 乘 f[n-j-1]，init[i] 为 f[i]；返回余数在 [0,mod)。

空/全零前缀返回空 rec，空 rec 的第 n 项返回 0；kth_term 在 n<init.size() 时直接返回该初值。

BM O(k·n)；Kitamasa 与 Bostan-Mori 均 O(k² log n)。

```cpp
// ---------- 模运算辅助 ----------
// 返回 x 在正模数 p 下的非负余数。
i64 mod_norm(i64 x, i64 p) {
    x %= p;
    if (x < 0)
        x += p;
    return x;
}

// 费马小定理求逆（p 为素数且 a != 0 mod p）。
i64 mod_inv_prime(i64 a, i64 p) {
    a = mod_norm(a, p);
    i64 r = 1, base = a;
    for (i64 e = p - 2; e; e >>= 1) {
        if (e & 1)
            r = r * base % p;
        base = base * base % p;
    }
    return r;
}

// 返回升幂系数乘积；两输入须非空，系数已规范且乘加不溢出；小阶数适用。
std::vector<i64> poly_mul(const std::vector<i64> &a, const std::vector<i64> &b, i64 mod) {
    std::vector<i64> c(a.size() + b.size() - 1, 0);
    for (size_t i = 0; i < a.size(); i++) {
        if (!a[i])
            continue;
        for (size_t j = 0; j < b.size(); j++) {
            c[i + j] = (c[i + j] + a[i] * b[j]) % mod;
        }
    }
    return c;
}

// 返回升幂余式系数；g 必须首一（最高次项系数为 1），空/常数 g 返回 {0}。
std::vector<i64> poly_mod(std::vector<i64> f, const std::vector<i64> &g, i64 mod) {
    int k = (int)g.size() - 1;
    if (k <= 0)
        return {0};
    i64 lead = mod_norm(g[k], mod);
    if (lead != 1) {
        i64 inv = mod_inv_prime(lead, mod);
        for (auto &x : f)
            x = x * inv % mod;
    }
    for (int i = (int)f.size() - 1; i >= k; i--) {
        i64 c = mod_norm(f[i], mod);
        if (!c)
            continue;
        for (int j = 0; j <= k; j++) {
            f[i - k + j] = (f[i - k + j] - c * g[j]) % mod;
        }
    }
    f.resize(k);
    for (auto &x : f)
        x = mod_norm(x, mod);
    while (f.size() > 1 && f.back() == 0)
        f.pop_back();
    return f;
}

// ---------- Berlekamp-Massey ----------
// 返回 rec，满足 f[n] = sum_{i=1}^{k} rec[i-1]*f[n-i]。
std::vector<i64> berlekamp_massey(const std::vector<i64> &s, i64 mod) {
    std::vector<i64> C(1, 1), B(1, 1);
    int L = 0, m = 1;
    i64 b = 1; // 上一次触发阶数提升时的非零 discrepancy，做更新系数 d/b 的分母
    for (int n = 0; n < (int)s.size(); n++) {
        i64 d = mod_norm(s[n], mod);
        for (int i = 1; i <= L; i++) {
            d = (d + C[i] * s[n - i]) % mod;
        }
        if (d == 0) {
            m++;
            continue;
        }
        std::vector<i64> T = C;
        i64 coef = d * mod_inv_prime(b, mod) % mod; // 更新系数是 d / b，不是 1 / d
        if (C.size() < B.size() + m)
            C.resize(B.size() + m, 0);
        for (int i = 0; i < (int)B.size(); i++) {
            C[i + m] = (C[i + m] - coef * B[i]) % mod;
            C[i + m] = mod_norm(C[i + m], mod);
        }
        if (2 * L <= n) {
            L = n + 1 - L;
            B = T;
            b = d; // 必须更新 b，否则后续更新系数全错
            m = 1;
        } else {
            m++;
        }
        if ((int)C.size() < L + 1)
            C.resize(L + 1, 0);
    }
    C.resize(L + 1);
    std::vector<i64> rec(L);
    for (int i = 0; i < L; i++)
        rec[i] = mod_norm(-C[i + 1], mod);
    return rec;
}

// ---------- Kitamasa（多项式快速幂）----------
// 已知 rec 与前 k 项 init，求 f[n]，O(k^2 log n)。
i64 kth_term(const std::vector<i64> &init, const std::vector<i64> &rec, u64 n, i64 mod) {
    int k = (int)rec.size();
    if (k == 0)
        return 0;
    if (n < (u64)init.size())
        return mod_norm(init[n], mod);
    std::vector<i64> g(k + 1, 0);
    g[k] = 1;
    for (int i = 0; i < k; i++)
        g[k - 1 - i] = mod_norm(-rec[i], mod);

    std::vector<i64> res(k, 0);
    res[0] = 1; // x^0
    std::vector<i64> base(k, 0);
    // base = x mod g(x)；k==1 时须先把 x 约成常数 rec[0]，否则指数全丢
    if (k == 1)
        base[0] = mod_norm(rec[0], mod);
    else
        base[1] = 1; // x

    while (n) {
        if (n & 1)
            res = poly_mod(poly_mul(res, base, mod), g, mod);
        base = poly_mod(poly_mul(base, base, mod), g, mod);
        n >>= 1;
    }
    i64 ans = 0;
    for (int i = 0; i < (int)res.size() && i < (int)init.size(); i++) {
        ans = (ans + res[i] * mod_norm(init[i], mod)) % mod;
    }
    return mod_norm(ans, mod);
}

// ---------- Bostan-Mori ----------
// 已知 rec 与至少前 k 项 init，返回 0 起点的 f[n] 模 mod，O(k² log n)。
i64 bostan_mori(const std::vector<i64> &init, const std::vector<i64> &rec, u64 n, i64 mod) {
    int k = (int)rec.size();
    if (k == 0)
        return 0;
    std::vector<i64> Q(k + 1, 0);
    Q[0] = 1;
    for (int i = 0; i < k; i++)
        Q[i + 1] = mod_norm(-rec[i], mod);
    std::vector<i64> P = poly_mul(std::vector<i64>(init.begin(), init.begin() + k), Q, mod);
    P.resize(k);

    auto poly_mul_pq = [&](const std::vector<i64> &a, const std::vector<i64> &b) {
        std::vector<i64> c(a.size() + b.size() - 1, 0);
        for (size_t i = 0; i < a.size(); i++) {
            if (!a[i])
                continue;
            for (size_t j = 0; j < b.size(); j++)
                c[i + j] = (c[i + j] + a[i] * b[j]) % mod;
        }
        return c;
    };
    // Q(-x)：奇数次项取负
    auto flip_odd = [&](const std::vector<i64> &a) {
        std::vector<i64> r(a.size());
        for (size_t i = 0; i < a.size(); i++)
            r[i] = (i & 1) ? mod_norm(-a[i], mod) : mod_norm(a[i], mod);
        return r;
    };

    while (n) {
        // 必须乘 Q(x)*Q(-x)（只含偶次项），不能乘 Q(x)^2 再取负
        std::vector<i64> Qm = flip_odd(Q);
        std::vector<i64> Pn = poly_mul_pq(P, Qm);
        std::vector<i64> Qn = poly_mul_pq(Q, Qm);
        std::vector<i64> Pe, Qe;
        for (size_t i = (int)(n & 1); i < (int)Pn.size(); i += 2)
            Pe.push_back(Pn[i]);
        for (size_t i = 0; i < Qn.size(); i += 2)
            Qe.push_back(Qn[i]);
        P = Pe;
        Q = Qe;
        n >>= 1;
    }

    i64 inv = mod_inv_prime(Q[0], mod);
    return mod_norm(P.empty() ? 0 : P[0] * inv % mod, mod);
}
```
