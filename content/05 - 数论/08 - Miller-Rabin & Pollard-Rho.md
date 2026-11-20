# Miller-Rabin & Pollard-Rho

分解时传正 i64；模乘、快速幂的模数 p>=1，指数 k>=0。 isprime 对 n<2 返回 false，在正 i64 范围内确定正确；factorize 对 n<=1 返回空，负数不按绝对值分解。

isprime O(12 log n)；Pollard-Rho 通常 O(n^{1/4} log n)，非最坏保证。

```cpp
#ifndef XCPC_MODPOW
#define XCPC_MODPOW

// 返回 a*b mod p。
i64 mulMod(i64 a, i64 b, i64 p) {
    i64 r = i64(i128(a) * b % p);
    return r < 0 ? r + p : r;
}

// 返回 a^b mod p。
i64 power(i64 a, i64 b, i64 p) {
    if (p == 1) {
        return 0;
    }
    i64 res = 1 % p;
    for (; b; b >>= 1, a = mulMod(a, a, p)) {
        if (b & 1) {
            res = mulMod(res, a, p);
        }
    }
    return res;
}

#endif // XCPC_MODPOW

// 返回 n 是否为质数。
bool isprime(i64 n) {
    if (n < 2) {
        return false;
    }
    for (i64 p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        if (n % p == 0) {
            return n == p;
        }
    }
    static constexpr int A[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37};
    int s = __builtin_ctzll(u64(n - 1));
    i64 d = (n - 1) >> s;
    for (auto a : A) {
        if (a == n) {
            return true;
        }
        i64 x = power(a, d, n);
        if (x == 1 || x == n - 1) {
            continue;
        }
        bool ok = false;
        for (int i = 0; i < s - 1; ++i) {
            x = mulMod(x, x, n);
            if (x == n - 1) {
                ok = true;
                break;
            }
        }
        if (!ok) {
            return false;
        }
    }
    return true;
}

// 返回 n 的升序质因数表，含重数。
std::vector<i64> factorize(i64 n) {
    std::vector<i64> p;
    if (n <= 1) {
        return p;
    }
    std::function<void(i64)> f = [&](i64 n) {
        if (n <= 10000) {
            for (i64 i = 2; i * i <= n; ++i) {
                for (; n % i == 0; n /= i) {
                    p.push_back(i);
                }
            }
            if (n > 1) {
                p.push_back(n);
            }
            return;
        }
        if (isprime(n)) {
            p.push_back(n);
            return;
        }
        auto g = [&](i64 x) { return (mulMod(x, x, n) + 1) % n; };
        i64 x0 = 2;
        while (true) {
            i64 x = x0, y = x0, d = 1;
            i64 pw = 1, lam = 0, v = 1;
            while (d == 1) {
                y = g(y);
                ++lam;
                v = mulMod(v, x > y ? x - y : y - x, n); // fabs(x - y)，避免 x - y 溢出
                if (lam % 127 == 0) {
                    d = std::gcd(v, n);
                    v = 1;
                }
                if (pw == lam) {
                    x = y;
                    pw *= 2;
                    lam = 0;
                    d = std::gcd(v, n);
                    v = 1;
                }
            }
            if (d != n) {
                f(d);
                f(n / d);
                return;
            }
            ++x0;
        }
    };
    f(n);
    std::sort(p.begin(), p.end());
    return p;
}
```
