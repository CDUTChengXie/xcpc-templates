# 扩展欧几里得（exgcd）

sol/inv 要求 m>0；inv 要求 0<=a<m 且 gcd(a,m)=1；中间运算须可放 i64，sol 的 b 不能是 LLONG_MIN。 sol 允许负 a、b；无解返回 {-1,-1}，有解为 x=x0+t*period；inv 不互素时 assert。

exgcd 写回 a*x+b*y=g；非负输入时 g=gcd(a,b)，负输入可能返回负 g；a=b=0 时 g=0。

exgcd O(log min(a,b))；sol O(log m)。

```cpp
// 写回 a*x+b*y=g 的系数，返回 g；负输入可能得到负 g。
i64 exgcd(i64 a, i64 b, i64 &x, i64 &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    i64 g = exgcd(b, a % b, y, x);
    y -= a / b * x;
    return g;
}

// 解 ax + b ≡ 0 (mod m)，返回 {x0, 周期}；无解 {-1, -1}
std::pair<i64, i64> sol(i64 a, i64 b, i64 m) {
    assert(m > 0);
    b *= -1;
    i64 x, y;
    i64 g = exgcd(a, m, x, y);
    if (g < 0) {
        g *= -1;
        x *= -1;
        y *= -1;
    }
    if (b % g != 0) {
        return {-1, -1};
    }
    x = x * (b / g) % (m / g);
    if (x < 0) {
        x += m / g;
    }
    return {x, m / g};
}

// 模逆元（模数任意，要求互素）
i64 inv(i64 a, i64 m) {
    i64 x, y;
    i64 g = exgcd(a, m, x, y);
    assert(g == 1);
    x %= m;
    if (x < 0) {
        x += m;
    }
    return x;
}
```
