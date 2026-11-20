# BSGS & exBSGS

a,b>=0、p>=1；bsgs 要求 gcd(a,p)=1；exbsgs 可使用任意正模数。 p=1 或 b≡1 返回 0；无解返回 -1；sqrt(p) 状态规模须可承受。

O(sqrt p)；空间 O(sqrt p)。

```cpp
// 求互素情形下 a^x≡b(mod p) 的最小非负解。
i64 bsgs(i64 a, i64 b, i64 p) {
    if (p == 1) {
        return 0;
    }
    a %= p, b %= p;
    if (b == 1) {
        return 0;
    }
    i64 m = std::ceil(std::sqrt((long double)p));
    std::unordered_map<i64, i64> mp;
    i64 t = b;
    for (i64 j = 0; j < m; j++) {
        mp[t] = j; // 重复值保留最大 j，才能得到最小 x
        t = (i128)t * a % p;
    }
    i64 am = 1;
    for (i64 j = 0; j < m; j++) {
        am = (i128)am * a % p;
    }
    i64 cur = 1;
    for (i64 i = 0; i <= m; i++) {
        auto it = mp.find(cur);
        if (it != mp.end()) {
            i64 x = i * m - it->second;
            if (x >= 0) {
                return x;
            }
        }
        cur = (i128)cur * am % p;
    }
    return -1;
}

// 求一般情形下 a^x≡b(mod p) 的最小非负解。
i64 exbsgs(i64 a, i64 b, i64 p) {
    if (p == 1) {
        return 0;
    }
    a %= p, b %= p;
    if (b == 1) {
        return 0;
    }
    i64 g = std::gcd(a, p), cnt = 0, mul = 1;
    while (g > 1) {
        if (b % g) {
            return -1;
        }
        b /= g;
        p /= g;
        mul = (i128)mul * (a / g) % p;
        cnt++;
        if (p == 1 || b == mul) {
            return cnt;
        }
        g = std::gcd(a, p);
    }
    i64 r0 = mul, r1 = p;
    i128 x0 = 1, x1 = 0;
    while (r1) {
        i64 q = r0 / r1;
        i64 r2 = r0 % r1;
        i128 x2 = x0 - (i128)q * x1;
        r0 = r1;
        r1 = r2;
        x0 = x1;
        x1 = x2;
    }
    i64 inv = (x0 % p + p) % p;
    i64 res = bsgs(a, (i128)b * inv % p, p);
    if (res == -1) {
        return -1;
    }
    return res + cnt;
}
```
