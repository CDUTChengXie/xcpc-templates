# 子集和变换（SOS DP）

每个集合有自己的权值，现在要给每个集合求「所有子集的权值和」。直接给每个集合枚举全部子集，总共要枚举 `3^n` 对：一个元素可以不在大集合、只在大集合、或也在子集。

改为一位一位处理。初始 `f[mask]` 只含集合自身；处理第 `i` 位时，若它为 1，把清掉这一位的集合的和加进来。不清和清掉对应「保留这一位」与「删掉这一位」两类，不重不漏。处理完所有位，就允许删掉任意若干位，得到全部子集。

`sosSum(f)`；f 长度为 2^n（n>=0，通常 n<=20~22），f[mask] 为集合自身权值，允许负数；所有中间和不溢出 i64。

O(n 2^n)，空间 O(2^n)。

```cpp
// 返回 g[mask]=Σ f[sub]，sub 遍历 mask 的所有子集（含空集与自身）
// 不修改原数组；长度不是正的 2 的幂时抛 invalid_argument
std::vector<i64> sosSum(std::vector<i64> f) {
    if (f.empty() || (f.size() & (f.size() - 1)))
        throw std::invalid_argument("SOS length must be a power of two");
    int n = 0;
    while ((1 << n) < (int)f.size())
        n++;
    for (int i = 0; i < n; i++) {
        for (int mask = 0; mask < (int)f.size(); mask++) {
            if (mask & (1 << i))
                f[mask] += f[mask ^ (1 << i)];
        }
    }
    return f;
}
```
