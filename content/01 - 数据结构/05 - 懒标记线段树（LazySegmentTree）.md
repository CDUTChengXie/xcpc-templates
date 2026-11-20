# 懒标记线段树（LazySegmentTree）

区间加用 `AddSumSegmentTree(toSumInfo(a))`，区间赋值用 `AssignSumSegmentTree(toAssignInfo(a))`；更新调用 `rangeApply`，查询调用 `rangeQuery`。

a 为 `vector<i64>`；实际值、区间和及 delta*长度均不溢出 i64；加法树真实值须>=-(1LL<<60)。 自定义 Info/Tag 时，合并须满足结合律（只改括号不改结果），Info{} 是单位元（合并后不改变另一项的值）、Tag{} 是空操作；含 len 的叶须正确初始化。

findFirst/Last 的判断函数须允许剪枝：整段不满足时，所有子段也不满足；不能用区间和>0 找正数。 下标从 0 编号，区间 [l,r)（含左端，不含右端），0<=l<=r<=n；p 须在 [0,n)。

n=0 合法；空区间返回单位元（合并后不改变另一项的值）；sum=0、len=0，最大值为 -(1LL<<60)；找不到返回 -1。 每组新数据用 init(叶数组)，或 init(n, SegSumInfo::leaf(0)) 重建全零加法树。

建树 O(n)；modify / rangeApply / rangeQuery O(log n)；findFirst / findLast 最坏 O(n)，最好 O(log n)；空间 4n。

```cpp
template <class Info, class Tag> struct LazySegmentTree {
    int n = 0;
    std::vector<Info> info;
    std::vector<Tag> tag;

    // 创建空对象；使用前调用 init
    LazySegmentTree() {}
    // 用 n_ 个单位元 Info() 建树；Info 不含区间长度时可用
    explicit LazySegmentTree(int n_) {
        init(n_, Info());
    }
    // 用 n_ 个相同叶子值建树；Info 含区间长度时必须用这个
    LazySegmentTree(int n_, const Info &leafValue) {
        init(std::vector<Info>(n_, leafValue));
    }
    // 用叶数组 T 建树
    template <class T> explicit LazySegmentTree(const std::vector<T> &init_) {
        init(init_);
    }

    // 重建 n_ 个相同叶值 v_
    void init(int n_, Info v_ = Info()) {
        init(std::vector<Info>(n_, v_));
    }

    // 用叶数组重建并丢弃旧状态
    template <class T> void init(const std::vector<T> &init_) {
        n = int(init_.size());
        size_t sz = 4 * std::max(1, n);
        info.assign(sz, Info());
        tag.assign(sz, Tag());
        if (n == 0) {
            return; // 空树：不做 build，避免 m = 0 导致的无限递归
        }
        std::function<void(int, int, int)> build = [&](int p, int l, int r) {
            if (r - l == 1) {
                info[p] = init_[l];
                return;
            }
            int m = (l + r) / 2;
            build(2 * p, l, m);
            build(2 * p + 1, m, r);
            pull(p);
        };
        build(1, 0, n);
    }

    // 由两个儿子的信息重算节点 p
    void pull(int p) {
        info[p] = info[2 * p] + info[2 * p + 1];
    }

    // 对节点 p 施加标记 v，同时更新信息与懒标记
    void apply(int p, const Tag &v) {
        info[p].apply(v);
        tag[p].apply(v);
    }

    // 把节点 p 的懒标记下推到两个儿子
    void push(int p) {
        apply(2 * p, tag[p]);
        apply(2 * p + 1, tag[p]);
        tag[p] = Tag();
    }

    // 递归把叶 x 改成 Info 值 v
    void modify(int p, int l, int r, int x, const Info &v) {
        if (r - l == 1) {
            info[p] = v;
            return;
        }
        int m = (l + r) / 2;
        push(p);
        if (x < m) {
            modify(2 * p, l, m, x, v);
        } else {
            modify(2 * p + 1, m, r, x, v);
        }
        pull(p);
    }

    // 给位置 x 赋 Info 值 v（0<=x<n）
    void modify(int x, const Info &v) {
        if (n == 0) {
            return;
        }
        modify(1, 0, n, x, v);
    }

    // 递归查询 [x,y) 的合并信息
    Info rangeQuery(int p, int l, int r, int x, int y) {
        if (l >= y || r <= x) {
            return Info(); // 空区间必须返回单位元
        }
        if (l >= x && r <= y) {
            return info[p];
        }
        int m = (l + r) / 2;
        push(p);
        return rangeQuery(2 * p, l, m, x, y) + rangeQuery(2 * p + 1, m, r, x, y);
    }

    // 返回 [l,r) 的合并信息；空区间返回单位元
    Info rangeQuery(int l, int r) {
        if (n == 0) {
            return Info();
        }
        return rangeQuery(1, 0, n, l, r);
    }

    // 递归给 [x,y) 施加标记 v
    void rangeApply(int p, int l, int r, int x, int y, const Tag &v) {
        if (l >= y || r <= x) {
            return;
        }
        if (l >= x && r <= y) {
            apply(p, v);
            return;
        }
        int m = (l + r) / 2;
        push(p);
        rangeApply(2 * p, l, m, x, y, v);
        rangeApply(2 * p + 1, m, r, x, y, v);
        pull(p);
    }

    // 给 [l,r) 施加标记 v
    void rangeApply(int l, int r, const Tag &v) {
        if (n == 0) {
            return;
        }
        rangeApply(1, 0, n, l, r, v);
    }

    // 找 [x, y) 内第一个满足 pred 的位置；无解返回 -1
    // 递归在 [x,y) 内找第一个满足 pred 的位置
    template <class F> int findFirst(int p, int l, int r, int x, int y, F &&pred) {
        if (l >= y || r <= x) {
            return -1;
        }
        if (l >= x && r <= y && !pred(info[p])) {
            return -1; // 整段都不满足才剪枝；部分覆盖时保守地往下找
        }
        if (r - l == 1) {
            return l;
        }
        int m = (l + r) / 2;
        push(p);
        int res = findFirst(2 * p, l, m, x, y, pred);
        if (res == -1) {
            res = findFirst(2 * p + 1, m, r, x, y, pred);
        }
        return res;
    }

    // 返回 [l,r) 内第一个满足 pred 的位置；无解 -1
    template <class F> int findFirst(int l, int r, F &&pred) {
        if (n == 0) {
            return -1;
        }
        return findFirst(1, 0, n, l, r, pred);
    }

    // 找 [x, y) 内最后一个满足 pred 的位置；无解返回 -1
    // 递归在 [x,y) 内找最后一个满足 pred 的位置
    template <class F> int findLast(int p, int l, int r, int x, int y, F &&pred) {
        if (l >= y || r <= x) {
            return -1;
        }
        if (l >= x && r <= y && !pred(info[p])) {
            return -1;
        }
        if (r - l == 1) {
            return l;
        }
        int m = (l + r) / 2;
        push(p);
        int res = findLast(2 * p + 1, m, r, x, y, pred);
        if (res == -1) {
            res = findLast(2 * p, l, m, x, y, pred);
        }
        return res;
    }

    // 返回 [l,r) 内最后一个满足 pred 的位置；无解 -1
    template <class F> int findLast(int l, int r, F &&pred) {
        if (n == 0) {
            return -1;
        }
        return findLast(1, 0, n, l, r, pred);
    }
};

// ---- 现成可用的「区间加 + 区间和 + 区间最大值」组合 ----
// 区间加法标记
struct SegAddTag {
    i64 add = 0; // 加法标记的单位元是 0

    // 合并两个加法标记
    void apply(const SegAddTag &t) & {
        add += t.add;
    }
};

// 区间加 + 区间和 + 区间最大值的节点信息
// 单位元必须是 {sum=0, mx=-INF, len=0}：len 初值为 1 会让空区间查询多加一段。
struct SegSumInfo {
    i64 sum = 0;
    i64 mx = -(1LL << 60); // 区间最大值，单位元为 -INF
    int len = 0;

    SegSumInfo() = default;
    SegSumInfo(i64 s, i64 m, int l) : sum(s), mx(m), len(l) {}

    // 构造一个长度为 1、值为 v 的叶子
    static SegSumInfo leaf(i64 v) {
        return SegSumInfo(v, v, 1);
    }

    // 对整段施加加法标记
    void apply(const SegAddTag &t) & {
        sum += t.add * len;
        mx += t.add; // 整段加同一个数，最值也加
    }

    // 合并左右两段信息
    friend SegSumInfo operator+(const SegSumInfo &a, const SegSumInfo &b) {
        return SegSumInfo(a.sum + b.sum, std::max(a.mx, b.mx), a.len + b.len);
    }
};

// 区间加 + 区间和的现成类型别名
using AddSumSegmentTree = LazySegmentTree<SegSumInfo, SegAddTag>;

// 把 vector<i64> 转成可建树的叶数组
inline std::vector<SegSumInfo> toSumInfo(const std::vector<i64> &a) {
    std::vector<SegSumInfo> r(a.size());
    for (size_t i = 0; i < a.size(); i++) {
        r[i] = SegSumInfo::leaf(a[i]);
    }
    return r;
}

// ---- 现成可用的「区间赋值 + 区间和」组合 ----
// 区间赋值标记
struct SegAssignTag {
    i64 v = 0;
    bool has = false; // false = 无操作标记（单位元）

    // 用新赋值标记覆盖旧标记
    void apply(const SegAssignTag &t) & {
        if (t.has) {
            v = t.v, has = true; // 新赋值覆盖旧赋值
        }
    }
};

// 区间赋值 + 区间和的节点信息
struct SegAssignInfo {
    i64 sum = 0;
    int len = 0;

    SegAssignInfo() = default;
    SegAssignInfo(i64 s, int l) : sum(s), len(l) {}

    // 对整段施加赋值标记
    void apply(const SegAssignTag &t) & {
        if (t.has) {
            sum = t.v * len;
        }
    }

    // 合并左右两段信息
    friend SegAssignInfo operator+(const SegAssignInfo &a, const SegAssignInfo &b) {
        return SegAssignInfo(a.sum + b.sum, a.len + b.len);
    }
};

using AssignSumSegmentTree = LazySegmentTree<SegAssignInfo, SegAssignTag>;

// 把 vector<i64> 转成 SegAssignInfo 叶数组
inline std::vector<SegAssignInfo> toAssignInfo(const std::vector<i64> &a) {
    std::vector<SegAssignInfo> r(a.size());
    for (size_t i = 0; i < a.size(); i++) {
        r[i] = SegAssignInfo(a[i], 1);
    }
    return r;
}

// 另三种现成组合：区间加最小值、仿射模和、位运算数值和；沿用上方建树/修改/查询流程。
```

## 其他标记组合（扩展）

依赖上方的 LazySegmentTree 和 SegAddTag。

加最小值选 AddMinSegmentTree，叶用 SegMinInfo::leaf(x)，标记用 SegAddTag{delta}；加法不溢出 i64。

仿射和选 `AffineSumSegmentTree<P>`，叶用 `SegAffineInfo<P>`::leaf(x)，1<P<=INT_MAX。

仿射标记 `SegAffineTag<P>`{mul,add} 将 x 改为 mul*x+add 模 P；0<=mul,add<P，{0,v} 即赋值。

位运算选 BitwiseSumSegmentTree，叶用 SegBitInfo::leaf(u32值)，标记用 SegBitTag::andWith/orWith/xorWith(mask)。

下标 0-based，区间 [l,r)，0<=l<=r<=长度；逐元素 leaf 得到的叶数组才能建树。

rangeQuery 返回信息对象：最小值读 mn（空 LLONG_MAX），仿射和读 sum（空 0），位运算和调用 sum()（空 0）。

建树 O(n)，修改/查询 O(log n)，拆位各乘 32；空间 O(n)，拆位乘 32。

```cpp
struct SegMinInfo {
    i64 mn = LLONG_MAX;
    int len = 0;
    // 返回值为 x、长度为 1 的数值叶。
    static SegMinInfo leaf(i64 x) {
        return {x, 1};
    }
    // 对非空节点施加区间加；无返回值。
    void apply(const SegAddTag &tag) {
        if (len)
            mn += tag.add;
    }
    // 返回两个相邻节点的最小值信息。
    friend SegMinInfo operator+(const SegMinInfo &a, const SegMinInfo &b) {
        return {min(a.mn, b.mn), a.len + b.len};
    }
};
using AddMinSegmentTree = LazySegmentTree<SegMinInfo, SegAddTag>;
template <int P> struct SegAffineTag {
    static_assert(1 < P);
    i64 mul = 1, add = 0;
    // 将新仿射 t 接到旧标记之后；无返回值。
    void apply(const SegAffineTag &t) {
        mul = mul * t.mul % P;
        add = (add * t.mul + t.add) % P;
    }
};
template <int P> struct SegAffineInfo {
    i64 sum = 0;
    int len = 0;
    // 将任意 i64 规范化为模 P 的数值叶，返回长度 1 的节点。
    static SegAffineInfo leaf(i64 x) {
        x %= P;
        if (x < 0)
            x += P;
        return {x, 1};
    }
    // 施加 x <- mul*x+add；参数须已规范化到 [0,P)。
    void apply(const SegAffineTag<P> &t) {
        assert(0 <= t.mul && t.mul < P && 0 <= t.add && t.add < P);
        sum = (sum * t.mul + t.add * (len % P)) % P;
    }
    // 返回相邻节点的模和及总长度。
    friend SegAffineInfo operator+(const SegAffineInfo &a, const SegAffineInfo &b) {
        return {(a.sum + b.sum) % P, a.len + b.len};
    }
};
template <int P> using AffineSumSegmentTree = LazySegmentTree<SegAffineInfo<P>, SegAffineTag<P>>;
struct SegBitTag {
    u32 zero = 0, one = UINT_MAX;
    // 返回区间 XOR x 的位映射标记。
    static SegBitTag xorWith(u32 x) {
        return {x, ~x};
    }
    // 返回区间 AND x 的位映射标记。
    static SegBitTag andWith(u32 x) {
        return {0, x};
    }
    // 返回区间 OR x 的位映射标记。
    static SegBitTag orWith(u32 x) {
        return {x, UINT_MAX};
    }
    // 将新位映射 t 接到旧标记之后；无返回值。
    void apply(const SegBitTag &t) {
        zero = (zero & t.one) | (~zero & t.zero);
        one = (one & t.one) | (~one & t.zero);
    }
};
struct SegBitInfo {
    array<int, 32> count{}; // count[b] 为这段区间内第 b 位为 1 的元素个数，b 从低位 0 算起
    int len = 0;
    // 返回 u32 数值的单元素叶，长度为 1。
    static SegBitInfo leaf(u32 x) {
        SegBitInfo v;
        v.len = 1;
        for (int b = 0; b < 32; b++)
            v.count[b] = (x >> b) & 1;
        return v;
    }
    // 对当前计数施加位映射标记；无返回值。
    void apply(const SegBitTag &t) {
        for (int b = 0; b < 32; b++) {
            int z = (t.zero >> b) & 1, o = (t.one >> b) & 1;
            count[b] = z == o ? z * len : (z ? len - count[b] : count[b]);
        }
    }
    // 返回该区间 u32 值的总和，结果为 u64。
    u64 sum() const {
        u64 s = 0;
        for (int b = 0; b < 32; b++)
            s += u64(count[b]) << b;
        return s;
    }
    // 返回两个相邻节点的逐位计数合并结果。
    friend SegBitInfo operator+(const SegBitInfo &a, const SegBitInfo &b) {
        SegBitInfo v;
        v.len = a.len + b.len;
        for (int i = 0; i < 32; i++)
            v.count[i] = a.count[i] + b.count[i];
        return v;
    }
};
using BitwiseSumSegmentTree = LazySegmentTree<SegBitInfo, SegBitTag>;
```
