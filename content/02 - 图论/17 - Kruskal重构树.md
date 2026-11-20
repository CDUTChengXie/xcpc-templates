# Kruskal重构树

无向图可不连通；edges 每条边为 {u,v,w}，三个分量均为 i64；构造后只 work 一次。 原点 0..n-1，虚点 n..tot-1，最多 2n-1 点；所有查询须在 work 后。 query(u,w) 返回只用边权 <=w 时 u 所在区域的节点号；maxEdgeOnPath 同点为 0。

不连通的瓶颈值为 -1，负权下可能与合法答案重合，须另行确认连通。

构建 O(m log m+n log n)，查询 O(log n) 时间；空间 O(m+n log n)。

```cpp
// Kruskal 重构森林
struct KruskalTree {
    int n;
    int tot;
    std::vector<std::array<i64, 3>> edges;
    std::vector<std::vector<int>> child; // work 后，child[u] 为重构树的孩子；原顶点没有孩子
    std::vector<i64> val;               // 虚点 u 的 val[u] 为此次合并的边权；原顶点为 0
    std::vector<int> fa;
    std::vector<int> parent; // parent[u] 为重构树上的父节点；森林的各根指向自身，不是并查集 fa
    std::vector<int> depth;
    int LOG;
    std::vector<std::vector<int>> up;

    // 创建含 n 个原点的重构森林
    KruskalTree(int n_, const std::vector<std::array<i64, 3>> &edges_)
        : n(n_), tot(n_), edges(edges_), child(2 * n_), val(2 * n_, 0) {
        fa.assign(2 * n_, 0);
        std::iota(fa.begin(), fa.end(), 0);
        parent.assign(2 * n_, 0);
        std::iota(parent.begin(), parent.end(), 0);
        LOG = 1;
        while ((1 << LOG) < 2 * n) {
            LOG++;
        }
    }

    // 返回并查集代表；仅供构建和查询调用
    int find(int x) {
        while (fa[x] != x) {
            x = fa[x] = fa[fa[x]];
        }
        return x;
    }

    // 建立重构森林和倍增表
    void work() {
        std::sort(edges.begin(), edges.end(),
                  [](const auto &a, const auto &b) { return a[2] < b[2]; });
        for (auto [u, v, w] : edges) {
            int ru = find(u), rv = find(v);
            if (ru == rv) {
                continue;
            }
            int node = tot++;
            val[node] = w;
            fa[ru] = fa[rv] = node;
            parent[ru] = parent[rv] = node;
            child[node].push_back(ru);
            child[node].push_back(rv);
        }
        up.assign(tot, std::vector<int>(LOG));
        for (int u = 0; u < tot; u++) {
            up[u][0] = parent[u];
        }
        for (int j = 1; j < LOG; j++) {
            for (int u = 0; u < tot; u++) {
                up[u][j] = up[up[u][j - 1]][j - 1];
            }
        }
        depth.assign(tot, 0);
        std::queue<int> que;
        for (int u = 0; u < tot; u++) {
            if (parent[u] == u) {
                que.push(u);
            }
        }
        while (!que.empty()) {
            int u = que.front();
            que.pop();
            for (int v : child[u]) {
                depth[v] = depth[u] + 1;
                que.push(v);
            }
        }
    }

    // 返回阈值 w 下 u 所属分量的最高祖先
    int query(int u, i64 w) {
        for (int j = LOG - 1; j >= 0; j--) {
            int v = up[u][j];
            if (v != u && val[v] <= w) {
                u = v;
            }
        }
        return u;
    }

    // 返回 u 到 v 的最小瓶颈路值，不连通为 -1
    i64 maxEdgeOnPath(int u, int v) {
        if (find(u) != find(v)) {
            return -1;
        }
        int a = u, b = v;
        if (depth[a] < depth[b]) {
            std::swap(a, b);
        }
        int d = depth[a] - depth[b];
        for (int j = 0; j < LOG; j++) {
            if (d >> j & 1) {
                a = up[a][j];
            }
        }
        if (a == b) {
            return val[a];
        }
        for (int j = LOG - 1; j >= 0; j--) {
            if (up[a][j] != up[b][j]) {
                a = up[a][j];
                b = up[b][j];
            }
        }
        return val[up[a][0]];
    }
};
```
