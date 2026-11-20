# Lucas 定理

p>=2 为素数，n>=0；建表需 O(p) 内存，(p-1)^2 须可放 i64；构造后不能改 p 复用旧表。 m<0 或 m>n 返回 0；第一次合法 C 查询自动建表，n=m=0 返回 1。

预处理 O(p)；单次查询 O(log_p n)。

```cpp
// 小素数模数下的大组合数计算器。
struct Lucas {
    i64 p;
    std::vector<i64> fact, invf;
    bool ready = false;

    // 构造固定模数 p 的 Lucas 实例。
    Lucas(i64 p_) : p(p_) {}

    // 预处理 fact/invf。
    void prepare() {
        fact.assign(p, 1);
        invf.assign(p, 1);
        for (i64 i = 1; i < p; i++) {
            fact[i] = fact[i - 1] * i % p;
        }
        auto power = [&](i64 a, i64 b) {
            i64 res = 1;
            while (b) {
                if (b & 1) {
                    res = res * a % p;
                }
                a = a * a % p;
                b >>= 1;
            }
            return res;
        };
        invf[p - 1] = power(fact[p - 1], p - 2);
        for (i64 i = p - 1; i >= 1; i--) {
            invf[i - 1] = invf[i] * i % p;
        }
        ready = true;
    }

    // 返回 C(n,m) mod p 的递归版本。
    i64 smallC(i64 n, i64 m) {
        if (m < 0 || m > n) {
            return 0;
        }
        if (n >= p) {
            return smallC(n % p, m % p) * smallC(n / p, m / p) % p;
        }
        if (!ready) {
            prepare();
        }
        return fact[n] * invf[m] % p * invf[n - m] % p;
    }

    // 返回 C(n,m) mod p。
    i64 C(i64 n, i64 m) {
        if (m < 0 || m > n) {
            return 0;
        }
        if (!ready) {
            prepare();
        }
        if (n < p) {
            return fact[n] * invf[m] % p * invf[n - m] % p;
        }
        i64 res = 1;
        while (n || m) {
            i64 ni = n % p, mi = m % p;
            if (mi > ni) {
                return 0;
            }
            res = res * fact[ni] % p * invf[mi] % p * invf[ni - mi] % p;
            n /= p;
            m /= p;
        }
        return res;
    }
};
```
