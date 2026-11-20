# 线段树（SegmentTree）

将数组转成 `vector<Info>` 后构造 `SegmentTree`；`modify(p,Info(value))` 单点赋值，`rangeQuery(l,r)` 查询。

a 为非空 `vector<int>`，元素在 [-inf,inf]，区间和不溢出 int。 更换 Info 时，operator+ 须满足结合律（只改括号不改结果），Info{} 须为合并单位元（合并后不改变另一项的值）。 下标从 0 编号，区间 [l,r)（含左端，不含右端），0<=l<=r<=a.size()；单点 p 须合法。

空区间返回 {sum=0,mn=inf,mx=-inf}；Info(0) 是数值零，Info{} 是单位元（合并后不改变另一项的值）。 每组新数据用 init(叶数组) 重建；只传长度建的是单位元（合并后不改变另一项的值）叶。

build / init O(n)；单点修改、单点查询、区间查询均 O(log n)；空间 O(n)。

```cpp
struct Info {
    int sum = 0;
    int mn = inf;
    int mx = -inf;

    // 单位元：sum=0、mn=+inf、mx=-inf，空区间合并时不影响其它段
    Info() {}
    // 构造单个数值 x 的叶信息：sum=mn=mx=x
    Info(int x) : sum(x), mn(x), mx(x) {}

    // 合并相邻两段的信息
    Info operator+(const Info &rhs) const {
        Info c;
        c.sum = sum + rhs.sum;
        c.mn = std::min(mn, rhs.mn);
        c.mx = std::max(mx, rhs.mx);
        return c;
    }
};

// 单点修改 + 区间查询的通用线段树，叶信息为 Info
struct SegmentTree {
    int n;
    std::vector<Info> info;

    // 创建空对象；使用前调用 init
    SegmentTree() {}
    // 创建 n_>0 个单位元叶的线段树
    SegmentTree(int n_) {
        init(n_);
    }
    // 用非空 Info 数组建树
    SegmentTree(const std::vector<Info> &init_) {
        init(init_);
    }

    // 重建 n_>0 个单位元叶
    void init(int n_) {
        init(std::vector<Info>(n_, Info()));
    }

    // 用非空 Info 数组重建并丢弃旧状态
    void init(const std::vector<Info> &init_) {
        n = init_.size();
        info.assign(4 << std::__lg(n), Info());
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

    // 由左右子节点信息重算节点 p
    void pull(int p) {
        info[p] = info[2 * p] + info[2 * p + 1];
    }

    // 递归把叶 x 改成 v
    void modify(int p, int l, int r, int x, const Info &v) {
        if (r - l == 1) {
            info[p] = v;
            return;
        }
        int m = (l + r) / 2;
        if (x < m) {
            modify(2 * p, l, m, x, v);
        } else {
            modify(2 * p + 1, m, r, x, v);
        }
        pull(p);
    }

    // 给位置 x 赋 Info 值 v（0<=x<n）
    void modify(int x, const Info &v) {
        modify(1, 0, n, x, v);
    }

    // 递归查询 [x,y) 的合并信息
    Info rangeQuery(int p, int l, int r, int x, int y) {
        if (l >= y || r <= x) {
            return Info();
        }
        if (l >= x && r <= y) {
            return info[p];
        }
        int m = (l + r) / 2;
        return rangeQuery(2 * p, l, m, x, y) + rangeQuery(2 * p + 1, m, r, x, y);
    }

    // 返回 [l,r) 的合并信息；空区间返回单位元
    Info rangeQuery(int l, int r) {
        return rangeQuery(1, 0, n, l, r);
    }
};
```
