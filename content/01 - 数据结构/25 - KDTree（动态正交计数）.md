# KDTree（动态正交计数）

整型坐标；只插入、不删除，局部失衡时重建。 矩形为闭区间 [x1,x2] × [y1,y2]；无点时返回 0。

矩形查询最坏 O(n)（不承诺严格中位平衡的 O(sqrt(n)) 界），插入摊还 O(log² n)；重建 O(m log m)；空间 O(n)。

```cpp
class KDTree2D {
    struct Node {
        array<i64, 2> p, lo, hi;
        int child[2] = {}, size = 1, axis = 0;
    };
    vector<Node> t{Node{}};
    int root = 0;
    void pull(int p) {
        t[p].lo = t[p].hi = t[p].p;
        t[p].size = 1;
        for (int c : t[p].child)
            if (c) {
                t[p].size += t[c].size;
                for (int d = 0; d < 2; d++) {
                    t[p].lo[d] = min(t[p].lo[d], t[c].lo[d]);
                    t[p].hi[d] = max(t[p].hi[d], t[c].hi[d]);
                }
            }
    }
    void collect(int p, vector<int> &ids) {
        if (!p)
            return;
        ids.push_back(p);
        for (int c : t[p].child)
            collect(c, ids);
    }
    int build(vector<int> &ids, int l, int r, int d) {
        if (l == r)
            return 0;
        int m = (l + r) / 2;
        nth_element(ids.begin() + l, ids.begin() + m, ids.begin() + r,
                    [&](int a, int b) { return t[a].p[d] < t[b].p[d]; });
        int p = ids[m];
        t[p].axis = d;
        t[p].child[0] = build(ids, l, m, d ^ 1);
        t[p].child[1] = build(ids, m + 1, r, d ^ 1);
        pull(p);
        return p;
    }
    int add(int p, int q, int d) {
        if (!p) {
            t[q].axis = d;
            pull(q);
            return q;
        }
        int side = t[q].p[t[p].axis] >= t[p].p[t[p].axis];
        t[p].child[side] = add(t[p].child[side], q, t[p].axis ^ 1);
        pull(p);
        if (4LL * max(t[t[p].child[0]].size, t[t[p].child[1]].size) > 3LL * t[p].size) {
            vector<int> ids;
            collect(p, ids);
            p = build(ids, 0, ids.size(), d);
        }
        return p;
    }
    int query(int p, const array<i64, 2> &lo, const array<i64, 2> &hi) const {
        if (!p)
            return 0;
        bool all = true, point = true;
        for (int d = 0; d < 2; d++) {
            if (t[p].hi[d] < lo[d] || hi[d] < t[p].lo[d])
                return 0;
            all &= lo[d] <= t[p].lo[d] && t[p].hi[d] <= hi[d];
            point &= lo[d] <= t[p].p[d] && t[p].p[d] <= hi[d];
        }
        if (all)
            return t[p].size;
        return int(point) + query(t[p].child[0], lo, hi) + query(t[p].child[1], lo, hi);
    }

  public:
    // 创建空点集；无返回值。
    KDTree2D() {
        t[0].size = 0;
    }
    // 插入一个二维点，重复点保留；无返回值。
    void insert(array<i64, 2> p) {
        Node node;
        node.p = p;
        t.push_back(node);
        root = add(root, t.size() - 1, 0);
    }
    // 返回闭矩形 [lo[0],hi[0]] × [lo[1],hi[1]] 的点数。
    int count(array<i64, 2> lo, array<i64, 2> hi) const {
        assert(lo[0] <= hi[0] && lo[1] <= hi[1]);
        return query(root, lo, hi);
    }
    // 返回横、纵坐标均不超过 hi 的点数。
    int prefix(array<i64, 2> hi) const {
        return count({LLONG_MIN, LLONG_MIN}, hi);
    }
};
```
