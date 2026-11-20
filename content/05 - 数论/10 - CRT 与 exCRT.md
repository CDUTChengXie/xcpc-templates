# CRT 与 exCRT

m、r 同长，m[i]>0 且 0<=r[i]<m[i]；crt 要求模数两两互素；最终 lcm 和 i64 中间值不得溢出。 下标从 0 开始，第 i 条限制为 x≡r[i](mod m[i])；空数组返回 {0,1}。

有解为 x=x0+t*period，其中 x0 最小非负，period 为模数最小公倍数；excrt 无解返回 {-1,-1}。

crt O(n)；excrt O(n log m)。

```cpp
// 合并任意正模数同余方程，返回最小非负解与 lcm。
std::pair<i64, i64> excrt(std::vector<i64> m, std::vector<i64> r) {
    int k = m.size();
    i64 x = 0, mod = 1;
    for (int i = 0; i < k; i++) {
        i64 a = mod, b = m[i], c = (r[i] - x % m[i] + m[i]) % m[i];
        i64 g = std::gcd(a, b);
        if (c % g) {
            return {-1, -1};
        }
        a /= g, b /= g, c /= g;
        i64 y = 0, yy = 0;
        auto exgcd = [&](auto self, i64 aa, i64 bb, i64 &xx, i64 &yy) -> void {
            if (!bb) {
                xx = 1, yy = 0;
                return;
            }
            self(self, bb, aa % bb, yy, xx);
            yy -= aa / bb * xx;
        };
        exgcd(exgcd, a, b, y, yy);
        i128 t = (i128)y % b * c % b;
        x += (i128)t * mod;
        mod = (i128)mod / g * m[i];
        x %= mod;
        if (x < 0) {
            x += mod;
        }
    }
    return {x, mod};
}

// 解两两互素模数的 CRT，返回最小非负解与模数乘积。
std::pair<i64, i64> crt(const std::vector<i64> &m, const std::vector<i64> &r) {
    i64 M = 1;
    for (i64 mi : m) {
        M *= mi;
    }
    i64 ans = 0;
    for (int i = 0; i < (int)m.size(); i++) {
        i64 Mi = M / m[i];
        i64 inv = 0, yy = 0;
        auto exgcd = [&](auto self, i64 aa, i64 bb, i64 &xx, i64 &yy) -> void {
            if (!bb) {
                xx = 1, yy = 0;
                return;
            }
            self(self, bb, aa % bb, yy, xx);
            yy -= aa / bb * xx;
        };
        exgcd(exgcd, Mi % m[i], m[i], inv, yy);
        inv = (inv % m[i] + m[i]) % m[i];
        ans = (ans + (i128)r[i] % M * Mi % M * inv) % M;
    }
    return {ans, M};
}
```
