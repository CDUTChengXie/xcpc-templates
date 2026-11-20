# 模快速幂（i64）

p>0、e>=0、0<=a<p，所有乘法中间值必须放得进 i64；大模数使用「快速幂与逆元」中的接口。

O(log e) 时间，O(1) 空间。

```cpp
// 返回 a^e mod p；p>0、e>=0、0<=a<p，乘法中间值须可用 i64 表示。
i64 mod_pow(i64 a, i64 e, i64 p) {
    i64 r = 1 % p;
    a %= p;
    for (; e > 0; e >>= 1) {
        if (e & 1)
            r = r * a % p;
        a = a * a % p;
    }
    return r;
}
```

## 素数原根（试除版）

依赖本文件的「模快速幂（i64）」。

p 必须为素数，模乘中间值须能放进 i64；p=2 返回 1，无原根返回 -1。

分解 p-1 为 O(sqrt p)，每个候选 O(不同素因子数*log p)。

```cpp
// 素数 p 的一个原根；p 为 2 返回 1。
i64 primitive_root(i64 p) {
    if (p == 2)
        return 1;
    // 分解 phi(p) = p - 1
    std::vector<i64> fac;
    i64 x = p - 1;
    for (i64 i = 2; i * i <= x; i++) {
        if (x % i == 0) {
            fac.push_back(i);
            while (x % i == 0)
                x /= i;
        }
    }
    if (x > 1)
        fac.push_back(x);
    for (i64 g = 2; g < p; g++) {
        bool ok = true;
        for (i64 f : fac) {
            if (mod_pow(g, (p - 1) / f, p) == 1) {
                ok = false;
                break;
            }
        }
        if (ok)
            return g;
    }
    return -1;
}
```

## 二次剩余判定（欧拉准则）

依赖本文件的「模快速幂（i64）」。

p 为素数，负 a 先规范；a%p==0 返回 true，模乘中间值须放得进 i64。

O(log p) 时间，O(1) 空间。

```cpp
// a 是否为模素数 p 的平方剩余（本实现也将 a % p == 0 判为 true，负输入须先规范）。
bool is_quadratic_residue(i64 a, i64 p) {
    if (p == 2)
        return true;
    a %= p;
    if (a == 0)
        return true;
    return mod_pow(a, (p - 1) / 2, p) == 1;
}
```

## Pell 已知解的幂

y1!=0，(x1,y1) 满足整数 D 的 x²-Dy²=1；矩阵平方和乘加都不能溢出 i64。n=0 返回 (1,0)。

O(log n) 时间，O(1) 空间。

```cpp
// 返回 (x1 + y1*sqrt(D))^n 的整数系数 (x_n, y_n)，D 由 (x1,y1) 反解。
// 前提：y1 != 0 且 (x1,y1) 是 x^2 - D*y^2 = 1 的解。
// 约定：返回的 (x,y) 满足 x^2 - D*y^2 = 1；n = 0 返回 (1,0)。
std::pair<i64, i64> pellPow(i64 x1, i64 y1, u64 n) {
    struct M {
        i64 a, b, c, d;
    };
    auto mul = [](M lhs, M rhs) {
        return M{lhs.a * rhs.a + lhs.b * rhs.c, lhs.a * rhs.b + lhs.b * rhs.d,
                 lhs.c * rhs.a + lhs.d * rhs.c, lhs.c * rhs.b + lhs.d * rhs.d};
    };
    if (y1 == 0)
        return {1, 0};
    i64 D = (x1 * x1 - 1) / (y1 * y1); // 由最小解反解 D
    M r{1, 0, 0, 1};
    M base{x1, D * y1, y1, x1};
    while (n) {
        if (n & 1)
            r = mul(r, base);
        base = mul(base, base);
        n >>= 1;
    }
    return {r.a, r.c};
}
```
