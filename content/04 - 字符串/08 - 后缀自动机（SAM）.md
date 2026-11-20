# 后缀自动机（SAM）

strings 为 `vector<string>`，每串仅含小写 a..z；单文本也放进数组；建好后查询，不改原串。 子串必须连续；times[i] 对应 strings[i]，包含重叠，找不到为 0；空模式出现串长+1 次。 空字符串集合的不同子串数和公共子串长度均为 0，次数数组为空。

建机 O(总长×26+串数×状态数+状态数 log 状态数)，空间 O(串数×状态数)；次数查询 O(|pattern|+串数)。

```cpp
// 在线构造的 26 字符后缀自动机。
struct SAM {
    static constexpr int ALPHABET_SIZE = 26;

    // 后缀自动机节点：最大串长、后缀链接与转移表。
    struct Node {
        int len;
        int link;
        std::array<int, ALPHABET_SIZE> next;
        Node() : len{}, link{}, next{} {}
    };

    std::vector<Node> t;

    // 创建并初始化空后缀自动机。
    SAM() {
        init();
    }

    // 清空状态并重建虚拟根和真根。
    void init() {
        t.assign(2, Node());
        t[0].next.fill(1);
        t[0].len = -1;
    }

    // 创建并返回一个空状态。
    int newNode() {
        t.emplace_back();
        return t.size() - 1;
    }

    // 从当前末尾状态 p 追加字符编号 c（0..25），返回新的末尾状态；每串初始 p=1
    int extend(int p, int c) {
        if (t[p].next[c]) {
            int q = t[p].next[c];
            if (t[q].len == t[p].len + 1) {
                return q;
            }
            int r = newNode();
            t[r].len = t[p].len + 1;
            t[r].link = t[q].link;
            t[r].next = t[q].next;
            t[q].link = r;
            while (t[p].next[c] == q) {
                t[p].next[c] = r;
                p = t[p].link;
            }
            return r;
        }
        int cur = newNode();
        t[cur].len = t[p].len + 1;
        while (!t[p].next[c]) {
            t[p].next[c] = cur;
            p = t[p].link;
        }
        t[cur].link = extend(p, c);
        return cur;
    }

    // 从当前末尾状态 p 追加小写字符 c，返回新的末尾状态；每串初始 p=1。
    int extend(int p, char c, char offset = 'a') {
        return extend(p, c - offset);
    }

    // 返回整数转移目标。
    int next(int p, int x) {
        return t[p].next[x];
    }

    // 返回字符转移目标。
    int next(int p, char c, char offset = 'a') {
        return next(p, c - offset);
    }

    // 返回后缀链接。
    int link(int p) {
        return t[p].link;
    }

    // 返回状态最大串长。
    int len(int p) {
        return t[p].len;
    }

    // 返回状态总数。
    int size() {
        return t.size();
    }
};

//

// 广义后缀自动机（多串）
```

## 广义后缀自动机（扩展）

依赖上方的 SAM。

所有串只含小写 a..z；输入为 `vector<string>`，空串合法。

contains 空模式返回 true；occurrences 空模式按每个串 n+1 次计；无输入串返回 0。

建机及出现次数 O(总字符数×26+串数×状态数+状态数 log 状态数)，空间 O(串数×状态数)。

```cpp
// 从多个字符串建立的广义后缀自动机。
class GeneralizedSAM {
    SAM sam;
    vector<string> strings;
    vector<vector<int>> counts;

  public:
    // 从多串建立子串并集自动机；每串从真根 1 出发。
    explicit GeneralizedSAM(const vector<string> &input) : strings(input) {
        for (const auto &s : strings) {
            int p = 1;
            for (char c : s) {
                assert('a' <= c && c <= 'z');
                p = sam.extend(p, c);
            }
        }
        int states = sam.t.size();
        counts.assign(states, vector<int>(strings.size()));
        for (int id = 0; id < int(strings.size()); id++) {
            int p = 1;
            for (char c : strings[id]) {
                p = sam.t[p].next[c - 'a'];
                counts[p][id]++;
            }
        }
        vector<int> order(states - 2);
        iota(order.begin(), order.end(), 2);
        sort(order.begin(), order.end(), [&](int a, int b) { return sam.t[a].len > sam.t[b].len; });
        for (int p : order)
            for (int id = 0; id < int(strings.size()); id++)
                counts[sam.t[p].link][id] += counts[p][id];
    }
    // 返回输入串的不同非空子串并集大小。
    i64 distinctSubstrings() const {
        i64 ans = 0;
        for (int p = 2; p < int(sam.t.size()); p++)
            ans += sam.t[p].len - sam.t[sam.t[p].link].len;
        return ans;
    }
    // 返回 pattern 是否为任意输入串的子串；空 pattern 返回 true。
    bool contains(const string &pattern) const {
        int p = 1;
        for (char c : pattern) {
            if (c < 'a' || c > 'z')
                return false;
            p = sam.t[p].next[c - 'a'];
            if (!p)
                return false;
        }
        return true;
    }
    // 返回 pattern 在每个输入串的重叠出现次数；空串在长度 n 的串中计 n+1 次。
    vector<int> occurrences(const string &pattern) const {
        vector<int> answer(strings.size());
        if (pattern.empty()) {
            for (int i = 0; i < int(strings.size()); i++)
                answer[i] = strings[i].size() + 1;
            return answer;
        }
        int p = 1;
        for (char c : pattern) {
            if (c < 'a' || c > 'z')
                return answer;
            p = sam.t[p].next[c - 'a'];
            if (!p)
                return answer;
        }
        return counts[p];
    }
    // 返回全部输入串的最长公共子串长度；空串集或含空串返回 0。
    int longestCommonSubstring() const {
        if (strings.empty())
            return 0;
        int states = sam.t.size();
        vector<int> order(states - 2), common(states);
        iota(order.begin(), order.end(), 2);
        sort(order.begin(), order.end(), [&](int a, int b) { return sam.t[a].len > sam.t[b].len; });
        for (int p = 2; p < states; p++)
            common[p] = sam.t[p].len;
        for (const auto &s : strings) {
            vector<int> best(states);
            int p = 1, len = 0;
            for (char c : s) {
                int x = c - 'a';
                while (p != 1 && !sam.t[p].next[x]) {
                    p = sam.t[p].link;
                    len = min(len, sam.t[p].len);
                }
                if (sam.t[p].next[x]) {
                    p = sam.t[p].next[x];
                    len++;
                } else {
                    p = 1;
                    len = 0;
                }
                best[p] = max(best[p], len);
            }
            for (int v : order) {
                int f = sam.t[v].link;
                best[f] = max(best[f], min(best[v], sam.t[f].len));
            }
            for (int v = 2; v < states; v++)
                common[v] = min(common[v], best[v]);
        }
        return *max_element(common.begin(), common.end());
    }
};
```
