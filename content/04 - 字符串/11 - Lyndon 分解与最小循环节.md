# Lyndon 分解与最小循环节

a、b 为 std::string；长度不同的两串不能互相循环移动；允许空串。 重复单元须完整拼成原串；没有更短单元时长度为原串长，空串为 0。 分解片段在原串中的区间为 从 0 编号 [start,end)，片段内容按字典序非递增。

duvalFactor/minPeriod O(n) 时间；isRotationEqual 最坏 O(n^2)；空间 O(n)。

```cpp
// Lyndon 分解中的半开区间 [start,end)。
struct LyndonFactor {
    int start, end; // 对应原串的 [start, end)
};

// 返回按字典序非增排列的 Lyndon 分解。
std::vector<LyndonFactor> duvalFactor(const std::string &s) {
    std::vector<LyndonFactor> res;
    int n = (int)s.size();
    int i = 0;
    while (i < n) {
        int j = i + 1, k = i;
        while (j < n && static_cast<unsigned char>(s[k]) <= static_cast<unsigned char>(s[j])) {
            if (static_cast<unsigned char>(s[k]) < static_cast<unsigned char>(s[j])) {
                k = i;
            } else {
                k++;
            }
            j++;
        }
        int period = j - k;
        while (i <= k) {
            res.push_back({i, i + period});
            i += period;
        }
    }
    return res;
}

// 返回完整重复的最短循环节长度；无真循环节时返回 n。
i64 minPeriod(const std::string &s) {
    int n = (int)s.size();
    if (n == 0) {
        return 0;
    }
    std::vector<int> nxt(n, 0);
    for (int i = 1; i < n; i++) {
        int j = nxt[i - 1];
        while (j > 0 && s[i] != s[j]) {
            j = nxt[j - 1];
        }
        if (s[i] == s[j]) {
            j++;
        }
        nxt[i] = j;
    }
    // 最长 border 对应周期 p=n-nxt[n-1]，仅当整除时成立。
    int p = n - nxt[n - 1];
    return (p > 0 && n % p == 0) ? p : n;
}

// 返回两串是否互为循环移位。
bool isRotationEqual(const std::string &a, const std::string &b) {
    if (a.size() != b.size()) {
        return false;
    }
    if (a.empty()) {
        return true;
    }
    return (a + a).find(b) != std::string::npos;
}
```
