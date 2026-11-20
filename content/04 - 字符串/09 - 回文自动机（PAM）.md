# 回文自动机（PAM）

输入仅含小写 a..z；用 add 按原串顺序加入字符，每组新数据重新构造 PAM。 节点 p 对应一种回文内容；occurrences[p] 为它的出现次数，包含重叠；两个根的次数为 0。

构造 O(n)，occurrenceCounts O(n)，空间 O(n)。

```cpp
// 在线构造的 26 字符回文自动机。
struct PAM {
    static constexpr int ALPHABET_SIZE = 26;

    // 回文自动机节点：长度、后缀链接、后缀计数与转移表。
    struct Node {
        int len;
        int link;
        int cnt;
        std::array<int, ALPHABET_SIZE> next;
        Node() : len{}, link{}, cnt{}, next{} {}
    };

    std::vector<Node> t;
    std::vector<i64> suffixEnds;
    int suff;
    std::string s;

    // 创建并初始化回文自动机。
    PAM() {
        init();
    }

    // 清空字符串、状态与最长回文后缀。
    void init() {
        t.assign(2, Node());
        suffixEnds.assign(2, 0);
        t[0].len = -1;
        suff = 1;
        s.clear();
    }

    // 创建并返回一个空节点。
    int newNode() {
        t.emplace_back();
        suffixEnds.push_back(0);
        return t.size() - 1;
    }

    // 追加字符，返回是否新增本质不同回文节点；当前最长回文后缀节点存于 suff
    bool add(char c) {
        assert('a' <= c && c <= 'z');
        int pos = s.size();
        s += c;
        int let = c - 'a';
        int cur = suff, curlen = 0;
        while (true) {
            curlen = t[cur].len;
            if (pos - 1 - curlen >= 0 && s[pos - 1 - curlen] == s[pos]) {
                break;
            }
            cur = t[cur].link;
        }
        if (t[cur].next[let]) {
            suff = t[cur].next[let];
            suffixEnds[suff]++;
            return false;
        }
        int num = newNode();
        suff = num;
        suffixEnds[suff]++;
        t[num].len = t[cur].len + 2;
        t[cur].next[let] = num;
        if (t[num].len == 1) {
            t[num].link = 1;
            t[num].cnt = 1;
            return true;
        }
        while (true) {
            cur = t[cur].link;
            curlen = t[cur].len;
            if (pos - 1 - curlen >= 0 && s[pos - 1 - curlen] == s[pos]) {
                t[num].link = t[cur].next[let];
                break;
            }
        }
        t[num].cnt = 1 + t[t[num].link].cnt;
        return true;
    }

    // 返回向两端加字符 x 后的节点。
    int next(int p, int x) {
        return t[p].next[x];
    }

    // 返回最长真回文后缀节点。
    int link(int p) {
        return t[p].link;
    }

    // 返回节点的回文长度。
    int len(int p) {
        return t[p].len;
    }

    // 返回各回文节点的重叠出现次数；根为 0，不修改原始计数，重复调用安全。
    vector<i64> occurrenceCounts() const {
        auto count = suffixEnds;
        for (int p = int(t.size()) - 1; p >= 2; p--)
            count[t[p].link] += count[p];
        count[0] = count[1] = 0;
        return count;
    }
    // 返回含两个根的节点总数。
    int size() {
        return t.size();
    }
};
```
