# 取石子游戏判负

堆数为非负 i64；正常游戏不能行动者输，反 Nim 取最后一颗者输。 wythoffLos 要求 |a-b|<=INT_MAX，序号 n 是非负 int；更大输入用 Wythoff 的 u64 接口。

fibonacciLos 要求生成下一斐波那契数时 i64 不溢出；nimKLos 的 k>=2、最大堆为小 int 且 maxv+k<INT_MAX。 Los 后缀返回 true 为先手必败；普通 Nim 每步只减一堆，威佐夫可减一堆或两堆同减正数。

斐波那契首步不可取完，以后最多取前一步的两倍；本文件 antiNimLos 空局面返回 true；需要标准终局约定时用 NimMoves。 nimKLos 每次只把一堆 v 减到 1<=r<v 且 v-r<=k*r，并非一次减多堆的 Moore Nim。

Nim / Anti-Nim O(k)；威佐夫 O(log n)；斐波那契 O(log n)；Nim-K 每次重建 O(maxv²) 表。

```cpp
// ---------- 普通 Nim ----------
// 异或和为 0 则先手必败；空堆视为 0，不影响结果。
bool nimLos(const std::vector<i64> &piles) {
    i64 x = 0;
    for (i64 v : piles) {
        x ^= v;
    }
    return x == 0;
}

// ---------- Anti-Nim（取完者输）----------
// 全 1 局面非零堆数为奇数则先手必败；否则按普通 Nim 异或判据。
bool antiNimLos(const std::vector<i64> &piles) {
    i64 x = 0;
    i64 cnt = 0;
    bool allOne = true;
    for (i64 v : piles) {
        if (v <= 0) {
            continue;
        }
        x ^= v;
        cnt++;
        if (v != 1) {
            allOne = false;
        }
    }
    if (cnt == 0) {
        return true; // 空局面返回 true，与取完者输的标准终局约定冲突
    }
    if (allOne) {
        return (cnt % 2 == 1);
    }
    return x == 0;
}

bool wythoffBrute(i64 a, i64 b);

// ---------- 威佐夫博弈 ----------
// Beatty 数列 L_k = floor(k*phi)，必败态为 (L_k, L_k+k)；用整数平方根精确计算，避免浮点误差。
static i64 wythoffNth(int n) {
    // 返回 L_n = floor(n*phi)，n 从 0 起，L_0=0
    if (n == 0) {
        return 0;
    }
    i64 k = n;
    i128 v = (i128)k * k * 5;
    i64 s = (i64)sqrtl((long double)v);
    // 校正到精确的 floor(sqrt(v))
    while ((i128)(s + 1) * (s + 1) <= v) {
        s++;
    }
    while ((i128)s * s > v) {
        s--;
    }
    return (i64)(((i128)k + s) / 2);
}

// 第 n 个必败对的第二堆 (L_n + n)，n 从 0 起。
i64 wythoffLosNth(int n) {
    return wythoffNth(n) + n;
}

// 返回威佐夫两堆是否必败；a、b 非负，差值须能表示为 int。
bool wythoffLos(i64 a, i64 b) {
    if (a > b) {
        std::swap(a, b);
    }
    if (a == 0 && b == 0) {
        return true;
    }
    // 必败 <=> L_{b-a} == a
    i64 k = b - a;
    return wythoffNth((int)k) == a;
}

// ---------- 斐波那契博弈 ----------
// 首步不能一次取完（cap = m-1）；m 属于 1,2,3,5,8,... 时先手必败。
bool fibonacciLos(i64 m) {
    if (m <= 0) {
        return true;
    }
    i64 a = 1, b = 2;
    if (m == 1 || m == 2) {
        return true;
    }
    while (b < m) {
        i64 t = a + b;
        a = b;
        b = t;
    }
    return b == m;
}

// ---------- Nim-K 博弈 ----------
// 单堆 SG 预处理表：每次选一堆 v 减到 r，要求 1<=r<v 且 v-r<=k*r。
// 前提：k>=2 时按规则使用；k<2 为特殊分支 sg(v)=v-1，不符合上述规则；每次调用重建 O(maxv²)。
static std::vector<int> nimKSgTable(int k, int maxv) {
    if (k < 2) {
        std::vector<int> t(maxv + 1);
        for (int v = 1; v <= maxv; v++)
            t[v] = v - 1;
        return t;
    }
    std::vector<int> sg(maxv + 1, 0);
    std::vector<char> seen(maxv + 2, 0);
    for (int v = 1; v <= maxv; v++) {
        // 合法 r 的下界 ceil(v/(k+1))
        int lo = (v + k) / (k + 1);
        if (lo < 1)
            lo = 1;
        for (int r = lo; r <= v - 1; r++) {
            if (sg[r] <= maxv)
                seen[sg[r]] = 1;
        }
        int g = 0;
        while (g <= maxv && seen[g])
            g++;
        sg[v] = g;
        // 清空标记，供下一层复用
        for (int r = lo; r <= v - 1; r++) {
            if (sg[r] <= maxv)
                seen[sg[r]] = 0;
        }
    }
    return sg;
}

// 返回单堆限制 v→r 规则的多堆局面是否必败；堆大小为小整数，k>=2。
bool nimKLos(const std::vector<i64> &piles, int k) {
    i64 maxv = 0;
    for (i64 v : piles)
        maxv = std::max(maxv, v);
    if (maxv <= 0) {
        return true; // 空局面不能行动，按正常规则判败
    }
    auto sg = nimKSgTable(k, (int)maxv);
    int x = 0;
    for (i64 v : piles) {
        x ^= sg[(int)v];
    }
    return x == 0;
}
```
