# Trie

每组数据先 `init()`，再用 `insert(word)` 插入；`contains`、`countWord`、`hasPrefix` 分别查询完整单词、次数和前缀。

仅支持小写 a..z；先 init()，每组新数据重新 init()；N 要大于实际节点数（不超过总字符数+1）。 可重复插入；空字符串也可作为单词；不存在时单词次数为 0，前缀判断为 false。

插入/查询 O(|s|)，空间 O(总字符数 × 26)。

```cpp
constexpr int N = 1E6 + 10;
constexpr int A = 26;

int trie[N][A]; // trie[u][c] 为节点 u 沿字符 'a'+c 的儿子编号；不存在为 0，根为 1
int ed[N];      // ed[u] 为在节点 u 结束的单词插入次数，不含只经过它的单词
int tot;

// 分配并清空一个新节点，返回节点编号。
int newNode() {
    int x = ++tot;
    std::fill(trie[x], trie[x] + A, 0);
    ed[x] = 0;
    return x;
}

// 清空 Trie 并创建真根 1。
void init() {
    tot = 0;
    newNode();
}

// 插入单词，返回终点节点编号。
int insert(const std::string &s) {
    int p = 1;
    for (auto c : s) {
        int x = c - 'a';
        if (!trie[p][x]) {
            trie[p][x] = newNode();
        }
        p = trie[p][x];
    }
    ed[p]++;
    return p;
}

// 返回 s 的终点节点；不是前缀时返回 0。
int query(const std::string &s) {
    int p = 1;
    for (auto c : s) {
        int x = c - 'a';
        if (!trie[p][x]) {
            return 0;
        }
        p = trie[p][x];
    }
    return p;
}

// 返回 s 是否曾作为完整单词插入。
bool contains(const std::string &s) {
    int p = query(s);
    return p && ed[p];
}

// 返回完整单词的插入次数；未插入返回 0。
int countWord(const std::string &s) {
    return ed[query(s)];
}

// 返回是否存在此前缀；空前缀始终存在。
bool hasPrefix(const std::string &s) {
    return query(s) != 0;
}
```
