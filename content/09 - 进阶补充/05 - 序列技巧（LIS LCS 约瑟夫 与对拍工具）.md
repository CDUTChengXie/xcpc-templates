# 最长严格递增子序列（LIS）

元素可以跳过，选出的数必须严格递增。先想最后一个数：以 `a[i]` 结尾时，它本身长度为 1，也可以接在前面某个比它小的 `a[j]` 后面。

~~~cpp
dp[i] = 1;
for (int j = 0; j < i; ++j)
    if (a[j] < a[i]) dp[i] = std::max(dp[i], dp[j] + 1);
~~~

逐个找前驱要平方时间。反过来看，同样长的序列只留末尾最小的那条，以后最容易接数。按长度保存这些末尾 `tails`；来一个 `x`，二分找第一个不小于 `x` 的末尾并替换，没有就添一项。`tails` 的长度是答案，但它本身未必是一条实际的子序列；还原要沿前驱下标回溯。

输入为 `vector<i64>`，允许空数组；返回下标从 0 起且递增。非严格递增另用不下降子序列版本。

O(n log n) 时间，O(n) 空间。

```cpp
// ---------- LIS（严格递增，O(n log n)）----------
// 返回严格递增 LIS 长度。
int lisLength(const std::vector<i64> &a) {
    std::vector<i64> tails;
    tails.reserve(a.size());
    for (i64 x : a) {
        auto it = std::lower_bound(tails.begin(), tails.end(), x); // 严格递增用 lower_bound
        if (it == tails.end()) {
            tails.push_back(x);
        } else {
            *it = x;
        }
    }
    return (int)tails.size();
}

// LIS 并还原出一种最优序列（返回长度与 0-based 下标序列）
std::pair<int, std::vector<int>> lisRecover(const std::vector<i64> &a) {
    int n = (int)a.size();
    if (n == 0)
        return {0, {}};
    std::vector<i64> tails;
    std::vector<int> tailIdx;    // tails[i] 对应的原序列下标
    std::vector<int> pre(n, -1); // 前驱，用于回溯
    for (int i = 0; i < n; i++) {
        i64 x = a[i];
        int pos = (int)(std::lower_bound(tails.begin(), tails.end(), x) - tails.begin());
        if (pos > 0)
            pre[i] = tailIdx[pos - 1];
        if (pos == (int)tails.size()) {
            tails.push_back(x);
            tailIdx.push_back(i);
        } else {
            tails[pos] = x;
            tailIdx[pos] = i;
        }
    }
    std::vector<int> res;
    for (int cur = tailIdx.back(); cur != -1; cur = pre[cur])
        res.push_back(cur);
    std::reverse(res.begin(), res.end());
    return {(int)tails.size(), res};
}
```

## 最长公共子序列（滚动 DP）

两串都允许跳过字符，但不能打乱顺序。`f[i][j]` 表示两个长度分别为 `i,j` 的前缀的 LCS 长度；任一前缀为空，答案就是 0。末字符相同，可以把它接到左上角的解后；不同时，最优解至少跳过一个末字符。

~~~cpp
if (a[i-1] == b[j-1]) f[i][j] = f[i-1][j-1] + 1;
else f[i][j] = std::max(f[i-1][j], f[i][j-1]);
~~~

只用到上一行和本行左边。把短串放在列上，从左往右更新；覆盖前先存下旧的 `dp[j]`，下一列就拿它当左上角。

按字节精确匹配；只返回长度，不还原方案。两边都很长时使用位集 LCS 等专用算法。

O(nm) 时间，O(min(n,m)) 空间。

```cpp
// ---------- LCS（滚动数组 DP，空间 O(min(n,m))）----------
// 返回两条字符串的最长公共子序列长度。
int lcsLength(const std::string &a, const std::string &b) {
    // 让 b 是较短的那个，滚动数组开在 b 上
    const std::string &s = (a.size() >= b.size()) ? a : b;
    const std::string &t = (a.size() >= b.size()) ? b : a;
    int m = (int)t.size();
    std::vector<int> dp(m + 1, 0);
    for (char ch : s) {
        int prev = 0; // 上一行的 dp[j-1]
        for (int j = 1; j <= m; j++) {
            int old = dp[j]; // 上一行的 dp[j]
            if (ch == t[j - 1]) {
                dp[j] = prev + 1;
            } else {
                dp[j] = std::max(dp[j], dp[j - 1]);
            }
            prev = old;
        }
    }
    return dp[m];
}
```

## 约瑟夫环（基础版）

人物从 0 编号，从编号 0 报 1，报到 k 者出局；k>=1，各步加法不能溢出 i64。n<=0 时幸存者为 -1，出局顺序为空。

幸存者 O(n)，完整顺序 O(n²)，空间分别 O(1)、O(n)。

```cpp
// ---------- 约瑟夫环 ----------
// n 人编号 0..n-1，从编号 0 报 1、报到 k 者出局；返回最后出局编号，n<=0 为 -1。
i64 josephus(i64 n, i64 k) {
    if (n <= 0) {
        return -1;
    }
    i64 f = 0;
    for (i64 i = 2; i <= n; i++) {
        f = (f + k) % i;
    }
    return f;
}

// 返回完整出局顺序（0-based 编号）；O(n²)，仅用于需要打印整个序列的题。
std::vector<i64> josephusOrder(i64 n, i64 k) {
    std::vector<i64> res;
    if (n <= 0) {
        return res;
    }
    std::vector<bool> alive(n, true);
    i64 left = n, idx = 0;
    while (left > 0) {
        idx = (idx + k - 1) % left;
        i64 cnt = 0, target = -1;
        for (i64 i = 0; i < n; i++) {
            if (!alive[i]) {
                continue;
            }
            if (cnt == idx) {
                target = i;
                break;
            }
            cnt++;
        }
        alive[target] = false;
        res.push_back(target);
        left--;
    }
    return res;
}
```

## XorShift64* 随机数

range 接受反序和负端点，交换后的 r-l+1 须是可表示的正 i64。取模映射存在轻微偏差，不用于需要严格均匀分布的抽样。

单次 O(1) 时间与空间。

```cpp
// xorshift64* 可复现随机数生成器；同种子给出同一批数据。
struct XorShift64Star {
    u64 s;
    // 固定种子，0 按 1 处理；按相同调用顺序复现。
    XorShift64Star(u64 seed = 88172645463325252ULL) : s(seed ? seed : 1) {}
    // 返回下一项 u64 伪随机数并推进状态。
    u64 next() {
        s ^= s >> 12;
        s ^= s << 25;
        s ^= s >> 27;
        return s * 2685821657736338717ULL;
    }
    // 返回闭区间内伪随机整数；反序先交换，r-l+1 须为可表示的正 i64。
    i64 range(i64 l, i64 r) {
        if (r < l) {
            std::swap(l, r);
        }
        return l + (i64)(next() % (u64)(r - l + 1));
    }
};
```

## 运行计时器

读取 elapsedUs 前先 start；不受系统时间调整影响。

单次 O(1) 时间与空间。

```cpp
// 基于 steady_clock 的计时器，返回微秒；不受系统时间调整影响。
struct Timer {
    std::chrono::steady_clock::time_point t0;
    // 重置开始时刻；首次读耗时前必须调用。
    void start() {
        t0 = std::chrono::steady_clock::now();
    }
    // 返回自最近一次 start 起经过的微秒数。
    i64 elapsedUs() {
        return std::chrono::duration_cast<std::chrono::microseconds>(
                   std::chrono::steady_clock::now() - t0)
            .count();
    }
};
```
