# 01Trie（动态多重集）

k 从 0 起，重复值占多个名次；maxXor 要求非空。mergeFrom 不能与自身合并，合并后清空对方；splitLess 的 limit 在 [0,2^32]。

分裂对象共享节点池但根互不重叠；节点不回收，空间随历史分配增长。

常规查询增删 O(32)，合并与分裂按实际访问节点数计，空间为历史节点数。

```cpp
class BitTrie32 {
    struct Node {
        int ch[2] = {}, cnt = 0;
    };
    shared_ptr<vector<Node>> pool;
    vector<Node> &t;
    int root = 0;
    int alloc() {
        t.push_back({});
        return t.size() - 1;
    }
    int unite(int a, int b) {
        if (!a || !b)
            return a ? a : b;
        t[a].cnt += t[b].cnt;
        t[a].ch[0] = unite(t[a].ch[0], t[b].ch[0]);
        t[a].ch[1] = unite(t[a].ch[1], t[b].ch[1]);
        return a;
    }
    int import(int a, int b, const BitTrie32 &other) {
        if (!b)
            return a;
        if (!a)
            a = alloc();
        t[a].cnt += other.t[b].cnt;
        t[a].ch[0] = import(t[a].ch[0], other.t[b].ch[0], other);
        t[a].ch[1] = import(t[a].ch[1], other.t[b].ch[1], other);
        return a;
    }
    pair<int, int> partition(int p, u64 l, u64 r, u64 limit) {
        if (!p || l >= limit)
            return {0, p};
        if (r <= limit)
            return {p, 0};
        int q = alloc();
        u64 m = (l + r) / 2;
        auto [a, b] = partition(t[p].ch[0], l, m, limit);
        auto [c, d] = partition(t[p].ch[1], m, r, limit);
        t[p].ch[0] = a;
        t[p].ch[1] = c;
        t[p].cnt = t[a].cnt + t[c].cnt;
        t[q].ch[0] = b;
        t[q].ch[1] = d;
        t[q].cnt = t[b].cnt + t[d].cnt;
        return {p, q};
    }
    BitTrie32(shared_ptr<vector<Node>> storage, int p)
        : pool(std::move(storage)), t(*pool), root(p) {}

  public:
    // 创建独占根的空多重集；分裂后的对象共用节点池但根互不重叠。
    BitTrie32() : pool(make_shared<vector<Node>>(1)), t(*pool), root(alloc()) {}
    BitTrie32(const BitTrie32 &) = delete;
    BitTrie32 &operator=(const BitTrie32 &) = delete;
    // 转移根的所有权；被移动对象成为空集合。
    BitTrie32(BitTrie32 &&other) noexcept
        : pool(other.pool), t(*pool), root(exchange(other.root, 0)) {}
    // 合并 other 的所有副本并清空 other；不能与自身合并，无返回值。
    void mergeFrom(BitTrie32 &other) {
        assert(this != &other);
        root = pool == other.pool ? unite(root, other.root) : import(root, other.root, other);
        other.root = 0;
    }
    // 留下严格小于 limit 的元素，返回其余元素；0<=limit<=2^32，重复值整体归一边。
    BitTrie32 splitLess(u64 limit) {
        assert(limit <= (1ULL << 32));
        auto [left, right] = partition(root, 0, 1ULL << 32, limit);
        root = left;
        return BitTrie32(pool, right);
    }
    // 返回多重集元素数，包含重复。
    int size() const {
        return t[root].cnt;
    }
    // 插入一个副本；无返回值。
    void insert(u32 x) {
        if (!root)
            root = alloc();
        int p = root;
        t[p].cnt++;
        for (int b = 31; b >= 0; b--) {
            int d = (x >> b) & 1;
            if (!t[p].ch[d]) {
                int q = alloc();
                t[p].ch[d] = q;
            }
            p = t[p].ch[d];
            t[p].cnt++;
        }
    }
    // 返回 x 的重复次数，不存在返回 0。
    int count(u32 x) const {
        int p = root;
        for (int b = 31; b >= 0 && p; b--)
            p = t[p].ch[(x >> b) & 1];
        return t[p].cnt;
    }
    // 删除一个副本；不存在返回 false。
    bool erase(u32 x) {
        if (!count(x))
            return false;
        int p = root;
        t[p].cnt--;
        for (int b = 31; b >= 0; b--) {
            p = t[p].ch[(x >> b) & 1];
            t[p].cnt--;
        }
        return true;
    }
    // 返回与 x 的最大异或值；多重集须非空。
    u32 maxXor(u32 x) const {
        assert(size() > 0);
        int p = root;
        u32 ans = 0;
        for (int b = 31; b >= 0; b--) {
            int d = ((x >> b) & 1) ^ 1;
            if (t[t[p].ch[d]].cnt)
                ans |= u32(1) << b;
            else
                d ^= 1;
            p = t[p].ch[d];
        }
        return ans;
    }
    // 返回第 k 小原值；k 从 0 起，重复值占多个名次。
    u32 kth(int k) const {
        assert(0 <= k && k < size());
        int p = root;
        u32 ans = 0;
        for (int b = 31; b >= 0; b--) {
            int cnt = t[t[p].ch[0]].cnt, d = k >= cnt;
            if (d) {
                k -= cnt;
                ans |= u32(1) << b;
            }
            p = t[p].ch[d];
        }
        return ans;
    }
    // 返回严格小于 x 的副本数。
    int countLess(u32 x) const {
        int p = root, ans = 0;
        for (int b = 31; b >= 0 && p; b--) {
            int d = (x >> b) & 1;
            if (d)
                ans += t[t[p].ch[0]].cnt;
            p = t[p].ch[d];
        }
        return ans;
    }
    // ponytail: 公共池节点不回收，空间随历史分配增长；大量删分合循环时增加空闲节点栈。
};
```

## 01Trie（可持久化版）

值为 u32，空根为 0；before 须逐值包含于 after，差分计数不得为负。k 从 0 起且合法，最大异或要求差分非空。

每次插入、查询 O(32)，每次插入新增 O(32) 节点。

```cpp
class PersistentBitTrie32 {
    struct Node {
        int ch[2] = {}, cnt = 0;
    };
    vector<Node> t{Node{}};
    int copy(int p) {
        Node node = t[p];
        t.push_back(node);
        return t.size() - 1;
    }
    void check(int p) const {
        assert(0 <= p && p < int(t.size()));
    }

  public:
    // 在版本 root 中插入一个 x，返回新根；原版本不变。
    int insert(int root, u32 x) {
        check(root);
        int result = copy(root), p = result;
        t[p].cnt++;
        for (int b = 31; b >= 0; b--) {
            int d = (x >> b) & 1, old = t[root].ch[d], q = copy(old);
            t[p].ch[d] = q;
            root = old;
            p = q;
            t[p].cnt++;
        }
        return result;
    }
    // 返回后版本减前版本的元素数；前版本须逐值包含于后版本。
    int size(int before, int after) const {
        check(before);
        check(after);
        assert(t[before].cnt <= t[after].cnt);
        return t[after].cnt - t[before].cnt;
    }
    // 返回差分多重集与 x 的最大异或值；差分须非空且每个值计数非负。
    u32 maxXor(int before, int after, u32 x) const {
        assert(size(before, after) > 0);
        u32 ans = 0;
        for (int b = 31; b >= 0; b--) {
            int d = ((x >> b) & 1) ^ 1;
            if (t[t[after].ch[d]].cnt - t[t[before].ch[d]].cnt > 0)
                ans |= u32(1) << b;
            else
                d ^= 1;
            before = t[before].ch[d];
            after = t[after].ch[d];
        }
        return ans;
    }
    // 返回差分多重集的第 k 小原值；k 从 0 开始。
    u32 kth(int before, int after, int k) const {
        assert(0 <= k && k < size(before, after));
        u32 ans = 0;
        for (int b = 31; b >= 0; b--) {
            int cnt = t[t[after].ch[0]].cnt - t[t[before].ch[0]].cnt, d = k >= cnt;
            if (d) {
                k -= cnt;
                ans |= u32(1) << b;
            }
            before = t[before].ch[d];
            after = t[after].ch[d];
        }
        return ans;
    }
};
```
