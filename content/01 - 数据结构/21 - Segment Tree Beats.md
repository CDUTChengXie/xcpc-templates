# Segment Tree Beats

n>=0，a 为 `vector<i64>`，为空表示 n 个零，否则至少 n 项。 初值、截断阈值、更新后真实值的绝对值严格小于 2^60；中间和、乘积不溢出 i64。 下标从 0 编号，区间 [l,r)（含左端，不含右端），0<=l<=r<=n；三种修改可以在同一棵树上混用。

空区间和为 0，最大值为 NEG_INF=-2^60，最小值为 POS_INF=2^60；每组新数据用 init(n,a)。

建树 O(n)，和/最值查询 O(log n)，混合修改总时间保守记 O((n+q) log² n)，单次最坏 O(n)；空间 O(n)。

```cpp
struct SegBeats {
    static constexpr i64 NEG_INF = -(1LL << 60);
    static constexpr i64 POS_INF = 1LL << 60;

    struct Node {
        i64 ma = NEG_INF;
        i64 se = NEG_INF;               // 次大值；NEG_INF 表示不存在
        i64 mi = POS_INF, si = POS_INF; // 最小值、严格次小值
        int countMin = 0;
        int cnt = 0; // 最大值出现次数
        i64 sum = 0;
        i64 add = 0; // 区间加懒标记
        int len = 0;
    };

    int n = 0;
    std::vector<Node> tr;

    // 创建空对象；使用前调用 init
    SegBeats() {}
    // 用 init_ 的前 n_ 项建区间加/取 min/取 max/求和树
    SegBeats(int n_, const std::vector<i64> &init_) {
        init(n_, init_);
    }

    // 用 init_ 的前 n_ 项重建并丢弃旧状态；n_ 可为 0
    void init(int n_, const std::vector<i64> &init_) {
        assert(n_ >= 0 && (init_.empty() || int(init_.size()) >= n_));
        n = n_;
        tr.assign(4 * std::max(1, n), Node());
        if (n == 0) {
            return; // 避免 __lg(0) 与 build(1,0,0) 的无限递归
        }
        std::function<void(int, int, int)> build = [&](int p, int l, int r) {
            tr[p].len = r - l;
            if (r - l == 1) {
                i64 v = init_.empty() ? 0 : init_[l];
                assert(NEG_INF < v && v < POS_INF);
                tr[p].mi = v;
                tr[p].countMin = 1;
                tr[p].ma = v;
                tr[p].se = NEG_INF;
                tr[p].cnt = 1;
                tr[p].sum = v;
                return;
            }
            int m = (l + r) / 2;
            build(2 * p, l, m);
            build(2 * p + 1, m, r);
            pull(p);
        };
        build(1, 0, n);
    }

    // 由左右儿子的信息重算节点 p
    void pull(int p) {
        Node &u = tr[p];
        const Node &L = tr[2 * p], &R = tr[2 * p + 1];
        u.sum = L.sum + R.sum;
        u.ma = std::max(L.ma, R.ma);
        u.cnt = (L.ma == u.ma ? L.cnt : 0) + (R.ma == u.ma ? R.cnt : 0);
        u.se = std::max(L.ma == u.ma ? L.se : L.ma, R.ma == u.ma ? R.se : R.ma);
        u.mi = std::min(L.mi, R.mi);
        u.countMin = (L.mi == u.mi ? L.countMin : 0) + (R.mi == u.mi ? R.countMin : 0);
        u.si = std::min(L.mi == u.mi ? L.si : L.mi, R.mi == u.mi ? R.si : R.mi);
        u.len = L.len + R.len;
    }

    // 对节点 p 整体加 x
    void applyAdd(int p, i64 x) {
        tr[p].mi += x;
        if (tr[p].si != POS_INF)
            tr[p].si += x;
        tr[p].ma += x;
        if (tr[p].se != NEG_INF) {
            tr[p].se += x;
        }
        tr[p].sum += x * tr[p].len;
        tr[p].add += x;
    }

    void applyMin(int p, i64 x) { // 前置条件：se < x < ma
        tr[p].sum += (x - tr[p].ma) * tr[p].cnt;
        if (tr[p].mi == tr[p].ma)
            tr[p].mi = x;
        else if (tr[p].si == tr[p].ma)
            tr[p].si = x;
        tr[p].ma = x;
    }

    // 将节点最小值升到 x；前提为 mi<x<si，无返回值。
    void applyMax(int p, i64 x) {
        tr[p].sum += (x - tr[p].mi) * tr[p].countMin;
        if (tr[p].ma == tr[p].mi)
            tr[p].ma = x;
        else if (tr[p].se == tr[p].mi)
            tr[p].se = x;
        tr[p].mi = x;
    }
    // 把节点 p 的标记下推到两个儿子
    void push(int p) {
        if (tr[p].add != 0) {
            applyAdd(2 * p, tr[p].add);
            applyAdd(2 * p + 1, tr[p].add);
            tr[p].add = 0;
        }
        // 父节点被取 min 过：子节点里等于「父 ma 旧值」的元素要跟着降下来
        if (tr[2 * p].ma > tr[p].ma) {
            applyMin(2 * p, tr[p].ma);
        }
        if (tr[2 * p + 1].ma > tr[p].ma) {
            applyMin(2 * p + 1, tr[p].ma);
        }
        if (tr[2 * p].mi < tr[p].mi)
            applyMax(2 * p, tr[p].mi);
        if (tr[2 * p + 1].mi < tr[p].mi)
            applyMax(2 * p + 1, tr[p].mi);
    }

    // 递归对 [ql,qr) 每个元素取 min(x)
    void rangeChMin(int p, int l, int r, int ql, int qr, i64 x) {
        if (l >= qr || r <= ql || tr[p].ma <= x) {
            return;
        }
        if (ql <= l && r <= qr && tr[p].se < x) {
            applyMin(p, x); // 只有最大值被改变，整块打标记
            return;
        }
        if (r - l == 1) {
            return; // 叶子的 se 是 NEG_INF，走到这说明 x <= NEG_INF，
        } // 已被前提排除；留作防御
        push(p);
        int m = (l + r) / 2;
        rangeChMin(2 * p, l, m, ql, qr, x);
        rangeChMin(2 * p + 1, m, r, ql, qr, x);
        pull(p);
    }

    // 将 [l,r) 每项改为 min(原值,x)，无返回值。
    void rangeChMin(int l, int r, i64 x) {
        assert(0 <= l && l <= r && r <= n && NEG_INF < x && x < POS_INF);
        if (n == 0) {
            return;
        }
        rangeChMin(1, 0, n, l, r, x);
    }

    // 递归对 [ql,qr) 每个元素加 x
    void rangeAdd(int p, int l, int r, int ql, int qr, i64 x) {
        if (l >= qr || r <= ql) {
            return;
        }
        if (ql <= l && r <= qr) {
            // 检查当前真实值；push 中子节点可能尚未继承父节点截断。
            assert(i128(tr[p].mi) + x > NEG_INF && i128(tr[p].ma) + x < POS_INF);
            applyAdd(p, x);
            return;
        }
        push(p);
        int m = (l + r) / 2;
        rangeAdd(2 * p, l, m, ql, qr, x);
        rangeAdd(2 * p + 1, m, r, ql, qr, x);
        pull(p);
    }

    // 给 [l,r) 每项加 x；更新后绝对值须严格小于 2^60，无返回值。
    void rangeAdd(int l, int r, i64 x) {
        assert(0 <= l && l <= r && r <= n);
        if (n == 0) {
            return;
        }
        rangeAdd(1, 0, n, l, r, x);
    }

    // 递归查询 [ql,qr) 的区间和与最大值
    std::pair<i64, i64> rangeQuery(int p, int l, int r, int ql, int qr) {
        if (l >= qr || r <= ql) {
            return {0, NEG_INF};
        }
        if (ql <= l && r <= qr) {
            return {tr[p].sum, tr[p].ma};
        }
        push(p);
        int m = (l + r) / 2;
        auto L = rangeQuery(2 * p, l, m, ql, qr);
        auto R = rangeQuery(2 * p + 1, m, r, ql, qr);
        return {L.first + R.first, std::max(L.second, R.second)};
    }

    // 返回 [l,r) 的和、最大值；空区间 {0,NEG_INF}。
    std::pair<i64, i64> rangeQuery(int l, int r) {
        assert(0 <= l && l <= r && r <= n);
        if (n == 0) {
            return {0, NEG_INF};
        }
        return rangeQuery(1, 0, n, l, r);
    }

  private:
    void chmax(int p, int l, int r, int a, int b, i64 x) {
        if (b <= l || r <= a || tr[p].mi >= x)
            return;
        if (a <= l && r <= b && x < tr[p].si) {
            applyMax(p, x);
            return;
        }
        push(p);
        int m = (l + r) / 2;
        chmax(p * 2, l, m, a, b, x);
        chmax(p * 2 + 1, m, r, a, b, x);
        pull(p);
    }
    i64 minimum(int p, int l, int r, int a, int b) {
        if (b <= l || r <= a)
            return POS_INF;
        if (a <= l && r <= b)
            return tr[p].mi;
        push(p);
        int m = (l + r) / 2;
        return std::min(minimum(p * 2, l, m, a, b), minimum(p * 2 + 1, m, r, a, b));
    }

  public:
    // 将 [l,r) 每项改为 max(原值,x)，与 chmin、add 可在同一棵树混用。
    void rangeChMax(int l, int r, i64 x) {
        assert(0 <= l && l <= r && r <= n && NEG_INF < x && x < POS_INF);
        if (l < r)
            chmax(1, 0, n, l, r, x);
    }
    // 返回 [l,r) 最小值，空区间 POS_INF。
    i64 rangeMinimum(int l, int r) {
        assert(0 <= l && l <= r && r <= n);
        return l == r ? POS_INF : minimum(1, 0, n, l, r);
    }
};

// 区间取 max：对数值取反复用 SegBeats 的取 min，不复制内部树。
```

## 区间取下限（扩展）

依赖上方的 SegBeats。

原值、取 max 阈值、更新后所有值的绝对值严格小于 2^60，和与乘积不溢出。

下标从 0 起，区间 [l,r)；rangeQuery 返回区间和与最小值。

继承 SegBeats 的均摊界；单次最坏 O(n)，空间 O(n)。

```cpp
class SegChMaxBeats {
    int n;
    SegBeats tree;
    static vector<i64> negate(const vector<i64> &a) {
        vector<i64> b;
        for (i64 x : a) {
            assert(-(1LL << 60) < x && x < (1LL << 60));
            b.push_back(-x);
        }
        return b;
    }
    void check(int l, int r) const {
        assert(0 <= l && l <= r && r <= n);
    }

  public:
    // 建立区间取 max 树；空数组合法。
    explicit SegChMaxBeats(const vector<i64> &a) : n(a.size()), tree(n, negate(a)) {}
    // 将 [l,r) 每项替换为 max(原值,x)，无返回值。
    void rangeChMax(int l, int r, i64 x) {
        check(l, r);
        assert(-(1LL << 60) < x && x < (1LL << 60));
        tree.rangeChMin(l, r, -x);
    }
    // 将 [l,r) 每项加 delta，更新后数值仍须在约定范围内。
    void rangeAdd(int l, int r, i64 delta) {
        check(l, r);
        assert(delta != LLONG_MIN);
        tree.rangeAdd(l, r, -delta);
    }
    // 返回 [l,r) 的和、最小值；空区间最小值为 2^60。
    pair<i64, i64> rangeQuery(int l, int r) {
        check(l, r);
        auto [sum, mx] = tree.rangeQuery(l, r);
        return {-sum, -mx};
    }
};
```
