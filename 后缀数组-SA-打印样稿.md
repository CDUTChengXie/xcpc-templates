# 后缀数组（SA）

将字符串的所有后缀按字典序排序，支持查询两个后缀的最长公共前缀、不同子串数和最长重复子串长度。

下标和排名均从 `0` 开始，后缀 `i` 表示 `s[i..n)`；字符串改变后用 `init(s)` 重建。

构造、空间均为 `O(n log n)`；`lcp` 查询为 `O(1)`，两种子串统计均为 `O(n)`。

```cpp
struct SA {
    int n; // 字符串长度
    // sa[k]：排名为 k 的后缀在原串中的起点
    // rk[i]：从 i 开始的后缀排名，0 表示最小
    // lc[k]：sa[k] 与 sa[k+1] 的最长公共前缀长度，共 n-1 项
    std::vector<int> sa, rk, lc;
    std::vector<std::vector<int>> st;

    // 空对象使用前先调用 init(s)
    SA() {}
    // 用 s 构造后缀数组及 LCP 查询表
    SA(const std::string &s) {
        init(s);
    }

    // 用 s 重建，清除上一组数据；允许空串
    void init(const std::string &s) {
        n = s.size();
        if (n == 0) {
            sa.clear();
            rk.clear();
            lc.clear();
            st.clear();
            return;
        }
        sa.resize(n);
        lc.resize(n - 1);
        rk.resize(n);
        std::iota(sa.begin(), sa.end(), 0);
        std::sort(sa.begin(), sa.end(), [&](int a, int b) {
            return static_cast<unsigned char>(s[a]) < static_cast<unsigned char>(s[b]);
        });
        rk[sa[0]] = 0;
        for (int i = 1; i < n; i++) {
            rk[sa[i]] = rk[sa[i - 1]] + (s[sa[i]] != s[sa[i - 1]]);
        }
        int k = 1;
        std::vector<int> tmp, cnt(n);
        tmp.reserve(n);
        while (rk[sa[n - 1]] < n - 1) {
            tmp.clear();
            for (int i = 0; i < k; i++) {
                tmp.push_back(n - k + i);
            }
            for (auto i : sa) {
                if (i >= k) {
                    tmp.push_back(i - k);
                }
            }
            std::fill(cnt.begin(), cnt.end(), 0);
            for (int i = 0; i < n; i++) {
                cnt[rk[i]]++;
            }
            for (int i = 1; i < n; i++) {
                cnt[i] += cnt[i - 1];
            }
            for (int i = n - 1; i >= 0; i--) {
                sa[--cnt[rk[tmp[i]]]] = tmp[i];
            }
            std::swap(rk, tmp);
            rk[sa[0]] = 0;
            for (int i = 1; i < n; i++) {
                rk[sa[i]] = rk[sa[i - 1]]
                    + (tmp[sa[i - 1]] < tmp[sa[i]] || sa[i - 1] + k == n
                       || tmp[sa[i - 1] + k] < tmp[sa[i] + k]);
            }
            k *= 2;
        }
        for (int i = 0, j = 0; i < n; i++) {
            if (rk[i] == 0) {
                j = 0;
            } else {
                for (j -= j > 0;
                     i + j < n && sa[rk[i] - 1] + j < n
                     && s[i + j] == s[sa[rk[i] - 1] + j];) {
                    j++;
                }
                lc[rk[i] - 1] = j;
            }
        }

        int K = std::__lg(n) + 1;
        st.assign(K, std::vector<int>(std::max(1, n - 1)));
        if (n > 1) {
            st[0] = lc;
            for (int j = 0; j < K - 1; j++) {
                for (int i = 0; i + (2 << j) <= n - 1; i++) {
                    st[j + 1][i] = std::min(st[j][i], st[j][i + (1 << j)]);
                }
            }
        }
    }

    // 返回内容不同的非空子串数量
    i64 distinctSubstrings() const {
        return i64(n) * (n + 1) / 2 - std::accumulate(lc.begin(), lc.end(), i64(0));
    }

    // 返回最长重复子串长度；允许重叠，没有则返回 0
    int longestRepeatedLength() const {
        return lc.empty() ? 0 : *std::max_element(lc.begin(), lc.end());
    }

    // 返回从 i、j 开始连续相同的字符数；i、j 在 [0,n)
    // 同起点返回 n-i；空串只允许 lcp(0,0)，返回 0
    int lcp(int i, int j) const {
        if (i == j) {
            return n - i;
        }
        int a = rk[i];
        int b = rk[j];
        if (a > b) {
            std::swap(a, b);
        }
        int len = b - a;
        int k = std::__lg(len);
        return std::min(st[k][a], st[k][b - (1 << k)]);
    }
};
```
