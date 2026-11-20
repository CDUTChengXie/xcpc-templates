# FHQ Treap

元素为 int，允许重复；总副本数及 rank 的结果须在 int 范围内；随机优先级只保证期望复杂度。 rank 和 kth 从 1 起，k 须在 [1,元素总数]；重复副本分别占名次。

predecessorValue/successorValue 无解返回 nullopt，可区分合法值 -1；旧 predecessor/successor 仍以 -1 表示无解。

insert / erase / rank / kth / predecessor / successor 均期望 O(log n)；空间 O(n)。

```cpp
// 按值分裂的无旋 Treap；0 号为空节点
struct FHQTreap {
    struct Node {
        int l = 0, r = 0;
        int val = 0;
        int pri = 0;
        int cnt = 1;
        int siz = 1;
    };

    std::vector<Node> t;
    int root = 0;
    std::mt19937 rng{(unsigned)std::chrono::steady_clock::now().time_since_epoch().count()};

    // 创建空树，仅保留 0 号空节点
    FHQTreap() {
        t.assign(1, Node{});
        t[0].siz = 0;
        t[0].cnt = 0;
    }

    // 新建一个值 val、计数 1 的节点，返回编号
    int newNode(int val) {
        t.push_back({0, 0, val, (int)rng(), 1, 1});
        return int(t.size()) - 1;
    }

    // 由左右子树重算节点 p 的子树大小
    void pull(int p) {
        t[p].siz = t[t[p].l].siz + t[t[p].r].siz + t[p].cnt;
    }

    // 按值拆：a 中全部 <= key，b 中全部 > key
    void split(int p, i64 key, int &a, int &b) {
        if (p == 0) {
            a = b = 0;
            return;
        }
        if (t[p].val <= key) {
            a = p;
            split(t[p].r, key, t[a].r, b);
            pull(a);
        } else {
            b = p;
            split(t[p].l, key, a, t[b].l);
            pull(b);
        }
    }

    // 合并两棵子树，要求 a 的最大值 <= b 的最小值
    int merge(int a, int b) {
        if (a == 0 || b == 0) {
            return a ? a : b;
        }
        if (t[a].pri < t[b].pri) {
            t[a].r = merge(t[a].r, b);
            pull(a);
            return a;
        }
        t[b].l = merge(a, t[b].l);
        pull(b);
        return b;
    }

    // 插入一个 val；已存在则计数加一
    void insert(int val) {
        int a, b, c;
        split(root, val, a, b);
        split(a, i64(val) - 1, a, c);
        if (c) {
            t[c].cnt++;
            pull(c);
        } else {
            c = newNode(val);
        }
        root = merge(merge(a, c), b);
    }

    // 删除一个 val；不存在则无操作
    void erase(int val) {
        int a, b, c;
        split(root, val, a, b);
        split(a, i64(val) - 1, a, c);
        if (c && --t[c].cnt == 0) {
            c = 0;
        } else if (c) {
            pull(c);
        }
        root = merge(merge(a, c), b);
    }

    // 返回 val 的重复次数
    int count(int val) {
        int a, b, c;
        split(root, val, a, b);
        split(a, i64(val) - 1, a, c);
        int ans = c ? t[c].cnt : 0;
        root = merge(merge(a, c), b);
        return ans;
    }

    // <= val 的元素个数
    int rankLE(i64 val) {
        int a, b;
        split(root, val, a, b);
        int ans = t[a].siz;
        root = merge(a, b);
        return ans;
    }

    // 严格小于 val 的个数 + 1
    int rank(int val) {
        return rankLE(i64(val) - 1) + 1;
    }

    // 在以 p 为根的子树中返回第 k 小（1-based）原值
    int kth(int p, int k) {
        assert(1 <= k && k <= t[p].siz);
        while (p) {
            if (k <= t[t[p].l].siz) {
                p = t[p].l;
            } else if (k <= t[t[p].l].siz + t[p].cnt) {
                return t[p].val;
            } else {
                k -= t[t[p].l].siz + t[p].cnt;
                p = t[p].r;
            }
        }
        return -1;
    }

    // 返回第 k 小（1-based）；k 须合法
    int kth(int k) {
        return kth(root, k);
    }

    // 返回严格前驱；无解 nullopt，允许集合中含有 -1。
    std::optional<int> predecessorValue(int val) {
        int k = rankLE(i64(val) - 1);
        return k ? std::optional<int>{kth(k)} : std::nullopt;
    }

    // 返回严格后继；无解 nullopt，允许集合中含有 -1。
    std::optional<int> successorValue(int val) {
        int k = rankLE(val);
        return k < t[root].siz ? std::optional<int>{kth(k + 1)} : std::nullopt;
    }

    // 返回严格小于 val 的最大值；无解 -1
    int predecessor(int val) {
        int a, b;
        split(root, i64(val) - 1, a, b);
        int ans = t[a].siz ? kth(a, t[a].siz) : -1;
        root = merge(a, b);
        return ans;
    }

    // 返回严格大于 val 的最小值；无解 -1
    int successor(int val) {
        int a, b;
        split(root, val, a, b);
        int ans = t[b].siz ? kth(b, 1) : -1;
        root = merge(a, b);
        return ans;
    }
};
```
