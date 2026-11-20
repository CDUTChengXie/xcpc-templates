# 类欧几里得（floor-sum 与整除分块）

floor_sum 要求 n>=0、m>0、a>=0、b>=0（a、b 为负时先整体归一化）。 结果为 i64 精确整数；各步乘积/累加须不溢出（含 n*(n-1)、a*n+b）；整除分块还需 r<LLONG_MAX，避免右端+1溢出。

floor_div O(1)；floor_sum O(log max(a,m))；sum_floor_div 最坏 O(sqrt(n))，额外空间均 O(1)。

```cpp
// 向下取整除法（含负数）；C++ 的 / 向零截断。
i64 floor_div(i64 x, i64 y) {
    i64 q = x / y;
    if ((x % y != 0) && ((x < 0) != (y < 0)))
        q--;
    return q;
}

// 类欧几里得：sum_{i=0}^{n-1} floor((a*i + b) / m)，参数非负，m > 0。
i64 floor_sum(i64 n, i64 m, i64 a, i64 b) {
    i64 ans = 0;
    while (true) {
        if (a >= m) {
            ans += (n - 1) * n / 2 * (a / m);
            a %= m;
        }
        if (b >= m) {
            ans += n * (b / m);
            b %= m;
        }
        i64 y = a * n + b;
        if (y < m)
            break;
        n = y / m;
        b = y % m;
        std::swap(m, a);
    }
    return ans;
}

// 整除分块：求 sum_{i=l}^{r} floor(n / i)（n >= 1, l >= 1, r <= n）。
i64 sum_floor_div(i64 n, i64 l, i64 r) {
    if (l > r)
        return 0;
    i64 ans = 0;
    for (i64 i = l; i <= r;) {
        i64 q = n / i;
        i64 j = n / q; // 同商区间的右端点
        if (j > r)
            j = r;
        ans += (j - i + 1) * q;
        i = j + 1;
    }
    return ans;
}
```
