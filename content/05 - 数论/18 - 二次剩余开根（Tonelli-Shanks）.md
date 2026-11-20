# 二次剩余开根（Tonelli-Shanks）

2<=p<=LLONG_MAX 且 p 为素数，调用者先保证素性。 a 可为负，自动规范取模；返回两个根中较小的一个；无解为空 optional，a≡0 返回有值的 0。

O(log² p) 域乘法，寻找非剩余另需 O(z log p)，O(1) 空间。

```cpp
#ifndef XCPC_TONELLI_SHANKS
#define XCPC_TONELLI_SHANKS
namespace modular_root {
    using ll = long long;
    // 返回 a^e mod p。
    ll power(ll a, ll e, ll p) {
        ll r = 1 % p;
        for (; e; e >>= 1, a = (__int128)a * a % p)
            if (e & 1)
                r = (__int128)r * a % p;
        return r;
    }
    // 返回素数域中较小的平方根，无解返回 nullopt。
    std::optional<ll> sqrt(ll a, ll p) {
        assert(p >= 2);
        a %= p;
        if (a < 0)
            a += p;
        if (a == 0 || p == 2)
            return a;
        if (power(a, (p - 1) / 2, p) != 1)
            return {};
        ll q = p - 1;
        int s = 0;
        while (!(q & 1))
            q >>= 1, ++s;
        ll z = 2;
        while (power(z, (p - 1) / 2, p) != p - 1)
            ++z;
        ll c = power(z, q, p), x = power(a, (q + 1) / 2, p), t = power(a, q, p);
        while (t != 1) {
            int i = 0;
            ll v = t;
            while (v != 1)
                v = (__int128)v * v % p, ++i;
            assert(i < s);
            ll b = c;
            for (int j = 0; j < s - i - 1; ++j)
                b = (__int128)b * b % p;
            x = (__int128)x * b % p;
            c = (__int128)b * b % p;
            t = (__int128)t * c % p;
            s = i;
        }
        return std::min(x, p - x);
    }
}
#endif
```
