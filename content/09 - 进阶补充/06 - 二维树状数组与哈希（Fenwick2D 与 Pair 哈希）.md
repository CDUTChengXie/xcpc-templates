# 二维树状数组（离散化坐标）

先 build(xs,ys) 登记所有将更新的横、纵坐标，各自排序去重；add 的 x、y 必须在表内。 按横纵坐标组合开 n*m 存储，须能放入内存；权值及累加须在 i64 范围，rect 的两下界不可为 LLONG_MIN。

add/sum/rect 用原始坐标；build 会清空旧数据，查询边界无需登记；闭矩形要求 x1<=x2、y1<=y2。 内部 rank/at 为 1 起点，at 是维护用的累加格，不是原坐标上的单点值，直接改它会破坏查询。

Fenwick2D 单点加/前缀和 O(log n·log m)，空间 O(n·m)（n·m 须能开下，1e8 会爆内存）。

```cpp
// ---------- 二维树状数组 ----------
// 二维树状数组：单点加 + 矩形求和，坐标先离散化。
class Fenwick2D {
  public:
    int n = 0, m = 0;
    std::vector<i64> xs_, ys_; // 离散化后的原始坐标（升序）
    std::vector<i64> bit;      // (n+1) * (m+1)，一维摊平省掉一层 vector 的开销

    // 登记坐标（排序去重）并清空数据。
    void build(std::vector<i64> xs, std::vector<i64> ys) {
        std::sort(xs.begin(), xs.end());
        xs.erase(std::unique(xs.begin(), xs.end()), xs.end());
        std::sort(ys.begin(), ys.end());
        ys.erase(std::unique(ys.begin(), ys.end()), ys.end());
        xs_ = std::move(xs);
        ys_ = std::move(ys);
        n = (int)xs_.size();
        m = (int)ys_.size();
        bit.assign((size_t)(n + 1) * (m + 1), 0);
    }

    // 返回 lower_bound 插入位置的1-based排名；add要求坐标已登记，查询上界无需登记。
    int rankX(i64 x) const {
        return (int)(std::lower_bound(xs_.begin(), xs_.end(), x) - xs_.begin()) + 1;
    }
    // 返回 y 在纵坐标表中的 1 起点插入排名；更新时必须已登记。
    int rankY(i64 y) const {
        return (int)(std::lower_bound(ys_.begin(), ys_.end(), y) - ys_.begin()) + 1;
    }

    // 返回内部 1-based 索引 (x,y) 的引用（非 const）。
    i64 &at(int x, int y) {
        return bit[(size_t)x * (m + 1) + y];
    }
    // 读取内部累加格，x∈[1,n]、y∈[1,m]；不是原坐标单点值。
    i64 at(int x, int y) const {
        return bit[(size_t)x * (m + 1) + y];
    }

    // 在已登记的原始坐标 (x, y) 上加 v；调用方保证 x/y 在 build 的表中。
    void add(i64 x, i64 y, i64 v) {
        int i = rankX(x), j = rankY(y);
        if (i == 0 || j == 0) {
            return; // 0 排名保护；合法坐标排名从 1 开始
        }
        for (int a = i; a <= n; a += a & -a) {
            for (int b = j; b <= m; b += b & -b) {
                at(a, b) += v;
            }
        }
    }

    // 查询原始坐标前缀 (-inf,x] x (-inf,y]；x/y小于对应最小值时返回0。
    i64 sum(i64 x, i64 y) const {
        int i = (int)(std::upper_bound(xs_.begin(), xs_.end(), x) - xs_.begin());
        int j = (int)(std::upper_bound(ys_.begin(), ys_.end(), y) - ys_.begin());
        i64 res = 0;
        for (int a = i; a > 0; a -= a & -a) {
            for (int b = j; b > 0; b -= b & -b) {
                res += at(a, b);
            }
        }
        return res;
    }

    // 查询闭矩形 [x1,x2] x [y1,y2] 的和
    i64 rect(i64 x1, i64 y1, i64 x2, i64 y2) const {
        return sum(x2, y2) - sum(x1 - 1, y2) - sum(x2, y1 - 1) + sum(x1 - 1, y1 - 1);
    }
};
```

## 整数 Pair / Tuple 哈希

叶子类型为 i64；元素顺序有意义，哈希不是无碰撞的相等判定。用于 unordered 容器时仍使用键的正常相等比较。

时间与额外空间均 O(1)。

```cpp
// ---------- Pair / Tuple 哈希 ----------
// splitmix64 混合函数，供 PairHash / TupleHash 内部使用。
static u64 splitmix64(u64 x) {
    x += 0x9e3779b97f4a7c15ULL;
    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
    x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
    return x ^ (x >> 31);
}

// 二元组哈希。
struct PairHash {
    // 返回两个有序整数的哈希值。
    size_t operator()(const std::pair<i64, i64> &p) const {
        // 不能写成 hash(x) ^ hash(y)，否则 x==y 时全撞一个桶
        return (size_t)splitmix64((u64)p.first + 0x9e3779b97f4a7c15ULL * (u64)p.second);
    }
};

// 三元组哈希。
struct TupleHash {
    // 返回三个有序整数的哈希值。
    size_t operator()(const std::tuple<i64, i64, i64> &t) const {
        u64 h = splitmix64((u64)std::get<0>(t));
        h = splitmix64(h ^ (u64)std::get<1>(t));
        h = splitmix64(h ^ (u64)std::get<2>(t));
        return (size_t)h;
    }
};
```
